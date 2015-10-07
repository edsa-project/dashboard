# -*- coding: utf-8 -*-
import unittest
import rdflib
import geonames as gn
import namespaces as ns
from rdflib.plugins.sparql import prepareQuery


class TestGeonames(unittest.TestCase):

    def test_find_location_simple(self):
        location = "Southampton, UK"
        tup = gn.find_location(location)
        self.assertTrue(isinstance(tup[0],rdflib.URIRef))
        self.assertTrue(isinstance(tup[1],rdflib.Graph))
        #At least we brought the correct name
        askplace = prepareQuery(""" ASK {
        ?iri gn:name ?name 
        }
        """, initNs = {'gn' : ns.geonames})
        self.assertTrue(tup[1].query(askplace,
            initBindings = {'name' : rdflib.Literal('Southampton')})) 

    def test_find_location_utf8(self):
        location = "Αθήνα, GR"
        tup = gn.find_location(location)
        self.assertTrue(isinstance(tup[0],rdflib.URIRef))
        self.assertTrue(isinstance(tup[1],rdflib.Graph))
        #At least we brought the correct name and country
        askplace = prepareQuery(""" ASK {
        ?iri gn:name ?name 
        }
        """, initNs = {'gn' : ns.geonames})
        self.assertTrue(tup[1].query(askplace,
            initBindings = {'name' : rdflib.Literal('Athens')})) 

        def test_find_location_unknown(self):
            location = "Unknownlandidfgdfg"
            with assertRaises(gn.NotFoundException):
                tup = gn.find_location(location)
            
    def test_is_inside_true(self):
        TESTFILE = "test-geonames.ttl"
        testgraph = rdflib.Graph()
        testgraph.parse(TESTFILE,format="turtle")
        location = "San Francisco, CA"
        self.assertTrue(gn.is_inside(location,testgraph))
        location = "London"
        self.assertFalse(gn.is_inside(location,testgraph))




if __name__ == '__main__':
    unittest.main()
