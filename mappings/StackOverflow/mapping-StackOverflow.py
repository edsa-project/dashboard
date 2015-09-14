import sys
sys.path.append('../utils')

from bs4 import BeautifulSoup
from rdflib import Graph, Namespace, URIRef, BNode, Literal
import geonames as gn

#HACK: set of constants for the classes and properties from EDSA ontology
edsa= Namespace('http://www.edsa-project.eu/edsa#')
edsajobs= Namespace('http://www.edsa-project.eu/jobs/')
edsaskills= Namespace('http://www.edsa-project.eu/skill/')
schema= Namespace('http://schema.org/')

#TODO: This an RSS, there should be programatical ways to have an order to limit
# duplication
#TODO: command line input
soup = BeautifulSoup(open("StackOverflow-010915.xml"),'lxml')
#soup = BeautifulSoup(open("smallinput.xml"),'lxml')

g = Graph()
c = 0
for item in soup.find_all('item'):
    subject = URIRef("http://www.edsa-project.eu/jobs/StackOverflow/"+str(c))
    #URL
    #TODO: Check for duplicates by URL
    g.add((subject,schema.url,Literal(item.guid.string)))
    #Title
    g.add((subject,schema.jobTitle,Literal(item.title.string)))
    for org in item.find_all('a10:name'):
        #hiringOrganization
        #TODO: Service to OpenCorporates to entity matching
        # Low priority
        g.add((subject,schema.hiringOrganization,Literal(org.string)))
    for cat in item.find_all('category'):
        #skills
        skill = URIRef("http://www.edsa-project.eu/skill/"+cat.string)
        g.add((subject,edsa.requiresSkill,skill))
        g.add((skill,edsa.lexicalValue,Literal(cat.string)))
    if item.location is not None:
        #location
        g.add((subject,schema.jobLocation,Literal(item.location.string)))
        try:
            tup = gn.find_location(item.location.string)
            g.add((subject,edsa.Location,URIRef(tup[0])))
            g += tup[1]
        except gn.NotFoundException as e:
            #TODO: Redirect to an error file
            print("%s in subject %s" % (e,subject))
            print("problematic location %s" % item.location.string)
    #Description
    g.add((subject,schema.description,Literal(item.description.string)))
    c = c+1

#TODO: CommandLine output
g.serialize(destination='stackOverflow-010915.ttl', format='turtle')
#g.serialize(destination='smallinput.ttl', format='turtle')
