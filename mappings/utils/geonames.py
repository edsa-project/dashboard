import requests
from rdflib import Graph 

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

    g = Graph()
    g.parse(data=r.text, format="xml")

    spquery= """
        SELECT DISTINCT ?iri WHERE {?iri gn:name ?y}
    """
    qres = g.query(spquery)
    iri = ''
    for row in qres:
        iri = row.iri
    if iri == '':
        raise NotFoundException("Could not found "+textlocation)
    else:
        return (iri,g)

"""
TODO: A real unit test
tup = find_location("Southampton, UK")
print("%s" % tup[0])
try:
    tup = find_location("dgdghl")
except NotFoundException as e:
    print e
"""

