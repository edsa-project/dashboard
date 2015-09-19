import namespaces as ns
from rdflib import Graph, Literal

def is_duplicate(graph,url):
    """
    takes an RDFGraph (we assume the EDSA dataset or a relevant slice) and 
    returns if url is present, thus detecting duplicate job posting
    """
    #For the moment with RDFLib, this will be refactored when we have our
    #endpoint
    if url is Literal:
        return (None,ns.schema.url,url) in graph
    else:
        return (None,ns.schema.url,Literal(url)) in graph