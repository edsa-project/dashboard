import sys, argparse
sys.path.append('../utils')

from bs4 import BeautifulSoup
from rdflib import Graph, Namespace, URIRef, BNode, Literal, XSD
import dateutil.parser as dtp
import namespaces as ns
import geonames as gn
from URLdeduplicator import is_duplicate

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

def main(argv):
    #TODO: This an RSS, there should be programatical ways to have an order to limit
    # duplication
    args = args_process(argv)

    soup = BeautifulSoup(open(args.inputfile),'lxml')

    currentbase = Graph()
    currentbase.load(args.current, format='turtle')

    g = Graph()
    for item in soup.find_all('item'):
        subject = URIRef(item.guid.string)
        url = URIRef(item.guid.string)
        #TODO: Check that with URL as subject, deduplication is not
        # needed
        if args.verbose:
            print "Processing post " + url
        if is_duplicate(currentbase,url):
            if args.verbose:
                print url +" identified as duplicate, skipping..."
            continue
        #URL
        g.add((subject,ns.schema.url,url))
        #Source
        g.add((subject,ns.schema.source,Literal("StackOverflow")))
        #Title
        g.add((subject,ns.schema.jobTitle,Literal(item.title.string)))
        #Description
        g.add((subject,ns.schema.description,Literal(item.description.string)))
        #PubDate
        date = dtp.parse(item.pubdate.string)
        g.add((subject,ns.schema.datePosted,
            Literal(date.isoformat(),datatype=XSD.Date)))

        for org in item.find_all('a10:name'):
            #hiringOrganization
            #TODO: Service to OpenCorporates to entity matching
            # Low priority, maybe can be done with SILK later
            g.add((subject,ns.schema.hiringOrganization,Literal(org.string)))
        for cat in item.find_all('category'):
            #skills
            skill = URIRef("http://www.edsa-project.eu/skill/"+cat.string)
            g.add((subject,ns.edsa.requiresSkill,skill))
            g.add((skill,ns.edsa.lexicalValue,Literal(cat.string)))
        if item.location is not None:
            #location
            g.add((subject,ns.schema.jobLocation,Literal(item.location.string)))
            try:
                tup = gn.find_location(item.location.string)
                g.add((subject,ns.edsa.Location,URIRef(tup[0])))
                g += tup[1]
            except gn.NotFoundException as e:
                #TODO: Redirect to an error file
                print("%s in subject %s" % (e,subject))
                print("problematic location %s" % item.location.string)


    currentbase += g
    g.serialize(destination=args.outputfile, format='turtle')
    currentbase.serialize(destination=args.current, format='turtle')

if __name__ == "__main__":
   main(sys.argv[1:])
