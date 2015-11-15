# -*- coding: utf-8 -*-
import sys
import requests
import json
from rdflib import Graph, Literal, XSD
from datetime import date
sys.path.append('../utils')
import namespaces as ns

URL="http://api.indeed.com/ads/apigetjobs"

def is_active(URL,joburl):
    """ Check if job is still there
    """
    sp = joburl.split('=')
    jobkey = sp[1]
    payload = {'publisher' : '2651738605780995',
            'jobkeys' : jobkey,
            'format' : 'json',
            'v' : 2}
    r = requests.get(URL,params=payload)
    jsonres = r.json()
    if len(jsonres[u'results']) == 0:
        print joburl + " is gone..."
        return False
    else: 
        return True

def set_expiry_date(joburl,expiry_date):
    """ Outputs a triple with the expired_date property
        for 
    """
    expiry = Literal(expiry_date,datatype=XSD.Date)
    return (joburl,ns.edsa['expiry_date'],expiry)


def set_expired(api,rdfbase):
    today = date.today()
    expired = Graph()
    for joburl in rdfbase.subjects(ns.schema.jobTitle,None):
        if is_active(api,joburl):
            expired.add(set_expiry_date(joburl,today))
    expired.serialize("expired_jobs-"+str(today)+".rdf")

def main(argv):
    rdfbase = Graph()
    rdfbase.load(sys.argv[1])
    set_expired(URL,rdfbase)

if __name__ == "__main__":
   main(sys.argv[1:])
