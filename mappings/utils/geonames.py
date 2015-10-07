import requests
from rdflib import Graph, Literal 
from rdflib.plugins.sparql import prepareQuery
import namespaces as ns

class NotFoundException(Exception):
    def __init__(self,value):
        self.value = value
    def __str__(self):
        return repr(self.value)


def find_location(textlocation):
    """
    returns a 2-tuple containing the RDFLIB node of textlocation as for
    the geonames api search, and the RDF-Graph with its description in Geonames.
    raise NotFoundException if textlocation was not found in GeoNames
    """
    payload = {'q' : textlocation,
            'username' : 'edsa_project',
            'featureClass' : 'P',
            'isNameRequired' : 'true',
            'maxRows' : '1'} 
    #TODO: For extra precision, countries need to be translated to ISO-3166.
    # The problem is that US locations have the state.

    r = requests.get('http://api.geonames.org/searchRDF', params=payload)

    result = Graph()
    result.parse(data=r.text, format="xml")

    spquery = """
        SELECT DISTINCT ?iri WHERE {?iri gn:name ?y}
    """;
    qres = result.query(spquery,initNs={"gn" : ns.geonames})
    
    iri = ''
    for row in qres:
        iri = row.iri
    if iri == '':
        raise NotFoundException("Could not found "+textlocation)
    
    #selectcountry= """
        #SELECT ?country WHERE {?iri gn:parentCountry ?country}
    #"""
    #qres = result.query(spquery)
    #country = ''
    #for row in qres:
        #country = row.country
    return (iri,result)

def is_inside(textplace,graph):
    """Returns true if the place defined as text is disambiguated in graph
    returns false otherwise"""
    askquery = prepareQuery(
            """ASK {?iri schema:jobLocation ?place .
                ?iri edsa:Location ?placeiri}""",
                initNs = {"schema" : ns.schema , 
                    "edsa" : ns.edsa})
    return bool(graph.query(askquery, initBindings={"place" : Literal(textplace)}))

