import namespaces as ns
from rdflib import Graph, URIRef

def is_duplicate(graph,url):
    """
    takes an RDFGraph (we assume the EDSA dataset or a relevant slice) and 
    returns if url is present, thus detecting duplicate job posting
    """
    #For the moment with RDFLib, this will be refactored when we have our
    #endpoint
    if url is URIRef:
        return (None,ns.schema.url,url) in graph
    else:
        return (None,ns.schema.url,URIRef(url)) in graph

def set_expiry_date(currentbase,newbase):
    """
    Pre: The merge was already done
    """
    # TODO: Substitute for type
    for job in currentbase.subject(ns.schema.jobtitle,None):
        if (job,None,None) not in newbase:
            d = date.today()
            literaldate = Literal(date.isoformat(),datatype=XSD.Date)
            currentbase.add((job,ns.edsa.date_expired,literaldate))
