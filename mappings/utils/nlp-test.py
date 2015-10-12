import unittest
import nlp
import callkeywords as ck
from rdflib import Graph, URIRef

class ExactPhraseTestCase(unittest.TestCase):
    phrase = "Data Science"

#    def setUp(self):

    def test_true(self):
        description = "This is a job in Data Science"
        description2 = "data science in lowercase should pass too"
        self.assertTrue(nlp.exact_phrase(self.phrase,description))
        self.assertTrue(nlp.exact_phrase(self.phrase,description2))

    def test_false(self):
        description = "This job is in other Science, not Data"
        self.assertFalse(nlp.exact_phrase(self.phrase,description))

class CleanNonExactTestCase(unittest.TestCase):
    dataset = Graph()
    datapath = "testdata.ttl"

    def setUp(self):
        self.dataset.load(self.datapath,format='turtle')

    def tearDown(self):
        self.dataset.remove((None,None,None))

    def test_filter_en(self):
        # The job to be filtered
        filtered = URIRef('http://gr.indeed.com/viewjob?jk=fe422897ac25bc90')
        # The jobs not to be filtered:
        nf1 = URIRef('http://gr.indeed.com/viewjob?jk=949945a49631b6ed')
        nf2 = URIRef('http://gr.indeed.com/viewjob?jk=0634d8886845c8bb')
        nlp.clean_non_exact(self.dataset,ck.keywords['en'])
        self.assertFalse((filtered,None,None) in self.dataset)
        # This test can be more exact, no triple was deleted unintentionally
        self.assertTrue((nf1,None,None) in self.dataset)
        self.assertTrue((nf2,None,None) in self.dataset)

        
        


if __name__ == '__main__':
    unittest.main()
