import json
from pprint import pprint
from rdflib import Graph, Namespace, URIRef, BNode, Literal

edsa= Namespace('http://www.edsa-project.eu/edsa#')
edsajobs= Namespace('http://www.edsa-project.eu/jobs/')
edsaskills= Namespace('http://www.edsa-project.eu/skill/')
schema= Namespace('http://schema.org/')

with open('GithubJobs-DataScience.json') as data_file:    
    data = json.load(data_file)

g = Graph()
c = 0
for job in data:
    subject = URIRef("http://www.edsa-project.eu/jobs/Github/"+str(c))
    g.add((subject,schema.jobTitle,Literal(job['title'])))
    g.add((subject,schema.hiringOrganization,Literal(job['company'])))
    g.add((subject,schema.url,Literal(job['url'])))
    g.add((subject,schema.jobLocation,Literal(job['location'])))
    g.add((subject,schema.description,Literal(job['description'])))
    c = c+1

g.serialize(destination='github.ttl', format='turtle')



