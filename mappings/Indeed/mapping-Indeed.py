import sys, argparse
sys.path.append('../utils')
import requests
from bs4 import BeautifulSoup, SoupStrainer
import logging
logging.basicConfig()

from rdflib import Graph, Namespace, URIRef, BNode, Literal, XSD
import dateutil.parser as dtp
from urlparse import urlparse, urlunparse, parse_qs
from urllib import urlencode
import namespaces as ns
import geonames as gn
from URLdeduplicator import is_duplicate

#TODO Put this function in a common library
def args_process(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("inputfile", help="XML input")
    parser.add_argument("outputfile", 
            help="Name of the output file")
    parser.add_argument("current", help="RDF Graph to add the data into")
    #parser.add_argument("errorfile", help="File for location errors")
    parser.add_argument("--verbose",help="verbose output",action="store_true")
    #TODO: check input validity
    args = parser.parse_args()
    return args


def get_description(url):
    """ Goes to the ad page and retrieve the full description
    """
    jobpage = requests.get(url)
    #only_results = SoupStrainer("job_summary")
    #soup = BeautifulSoup(jobpage.text, parse_only=only_results)
    soup = BeautifulSoup(jobpage.text,'lxml')
    content = ""
    for summary in soup.find_all(id='job_summary'):
            content += summary.text
    return content

def shrink_url(url):
    """ URLs from the source have some extra clutter query parameters that are not compatible for using as IRI
    This function reduces those URLs to the minimum.
    """
    spliturl = urlparse(url)
    query = parse_qs(spliturl.query)
    jobkey = urlencode({'jk' : query['jk'][0]})
    tup = (spliturl.scheme,spliturl.netloc,spliturl.path,spliturl.params,jobkey,spliturl.fragment)
    newurl = urlunparse(tup)
    return newurl


def main(argv):
    args = args_process(argv)

    soup = BeautifulSoup(open(args.inputfile),'lxml')

    currentbase = Graph()
    currentbase.load(args.current, format='turtle')

    g = Graph()
    for item in soup.find_all('result'):
        url = shrink_url(item.url.string.strip())
        subject = URIRef(url)
        #TODO: Check that with URL as subject, deduplication is not
        # needed
        if args.verbose:
            print "Processing post " + url
        
        if is_duplicate(currentbase,subject) or is_duplicate(g,subject):
            if args.verbose:
                print url +" identified as duplicate, skipping..."
            continue
        #URL
        g.add((subject,ns.schema.url,URIRef(url)))
        #Source
        g.add((subject,ns.schema.source,Literal("Indeed")))
        #Title
        g.add((subject,ns.schema.jobTitle,Literal(item.jobtitle.string.strip())))
        #Description
        g.add((subject,ns.schema.description,Literal(get_description(url))))
        #PubDate
        date = dtp.parse(item.date.string)
        g.add((subject,ns.schema.datePosted,
            Literal(date.isoformat(),datatype=XSD.Date)))

        #hiringOrganization
        try:
            g.add((subject,ns.schema.hiringOrganization,
                Literal(item.company.string.strip())))
        except AttributeError:
            if args.verbose:
                print ("%s has no company in the source data" % subject)
        #location
        location = item.formattedlocation.string.strip()
        g.add((subject,ns.schema.jobLocation,Literal(location)))
        try:
            #TODO changing point when separating geonames subset from current base
            if gn.is_inside(location,currentbase):
                if args.verbose:
                    print ("%s already linked to geonames, reusing..." % location)
                lociri = gn.get_iri(location,currentbase)
                g.add((subject,ns.edsa.Location,lociri))
            elif gn.is_inside(location,g):
                if args.verbose:
                    print ("%s already linked to geonames, reusing..." % location)
                lociri = gn.get_iri(location,g)
                g.add((subject,ns.edsa.Location,lociri))
            else:
                tup = gn.find_location(item.formattedlocation.string.strip())
                g.add((subject,ns.edsa.Location,URIRef(tup[0])))
                g += tup[1]
        except gn.NotFoundException as e:
            #TODO: Redirect to an error file
            print("%s in subject %s" % (e,subject))
            print("problematic location %s" % item.formattedlocation.string)


    currentbase += g
    g.serialize(destination=args.outputfile, format='turtle')
    currentbase.serialize(destination=args.current, format='turtle')

if __name__ == "__main__":
   main(sys.argv[1:])
