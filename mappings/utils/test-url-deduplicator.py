import unittest
from rdflib import Graph, Literal
from URLdeduplicator import is_duplicate

TESTGRAPH="testgraph.ttl"
g = Graph()
g.parse(TESTGRAPH,format="turtle")
URLTRUE="http://careers.stackoverflow.com/jobs/55843/data-analytics-engineer-sharethrough"
URLFALSE="http://careers.stackoverflow.com/jobs/000/work-at-joes"

class TestURLDeduplicator(unittest.TestCase):

    def test_is_duplicate_raw(self):
        self.assertTrue(is_duplicate(g,URLTRUE))
        self.assertFalse(is_duplicate(g,URLFALSE))

    def test_is_duplicate_literal(self):
        self.assertTrue(is_duplicate(g,Literal(URLTRUE)))
        self.assertFalse(is_duplicate(g,Literal(URLFALSE)))

if __name__ == '__main__':
    unittest.main()
        


