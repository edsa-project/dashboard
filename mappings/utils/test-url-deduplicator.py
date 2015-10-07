import unittest
from rdflib import Graph, URIRef
from URLdeduplicator import is_duplicate

TESTGRAPH="testdata.ttl"
g = Graph()
g.parse(TESTGRAPH,format="turtle")
URLTRUE="http://gr.indeed.com/viewjob?jk=0634d8886845c8bb"
URLFALSE="http://careers.stackoverflow.com/jobs/000/work-at-joes"

class TestURLDeduplicator(unittest.TestCase):

    def test_is_duplicate_raw(self):
        self.assertTrue(is_duplicate(g,URLTRUE))
        self.assertFalse(is_duplicate(g,URLFALSE))

    def test_is_duplicate_literal(self):
        self.assertTrue(is_duplicate(g,URIRef(URLTRUE)))
        self.assertFalse(is_duplicate(g,URIRef(URLFALSE)))

if __name__ == '__main__':
    unittest.main()
        


