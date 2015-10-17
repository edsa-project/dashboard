# -*- coding: utf-8 -*-
import unittest
import nlp
import callkeywords as ck
import namespaces as ns
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

class SkillSetTestCase(unittest.TestCase):
    cIRI = URIRef("http://www.edsa-project.eu/skill/c")
    csharpIRI = URIRef("http://www.edsa-project.eu/skill/c#")
    mlIRI = URIRef("http://www.edsa-project.eu/skill/machine-learning>")
    perlIRI = URIRef("http://www.edsa-project.eu/skill/perl")
    javaIRI = URIRef("http://www.edsa-project.eu/skill/java")
    otherIRI = URIRef("http://example.org/OtherSkill")
    skilldict = {"c" : cIRI, "Machine Learning" : mlIRI , "perl" : perlIRI,
            "OtherSkill" : otherIRI , "C#"  : csharpIRI, "java" : javaIRI}

    jobiri = URIRef("http://www.example.org/job123")

    def test_skill_set(self):
        description = """
        We need someone that knows C, Perl and Java to do machine learning.
        """
        result = nlp.skill_set(self.jobiri,description,self.skilldict)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.cIRI) in result)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.mlIRI) in result)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.perlIRI) in result)
        self.assertFalse((self.jobiri,ns.edsa.requiresSkill,self.otherIRI) in result)

    def test_single_char(self):
        description = "description cec lac, cac"
        result = nlp.skill_set(self.jobiri,description,self.skilldict)
        self.assertTrue(len(result)==0)
        description = "This jobs requires C "

    def test_special_char(self):
        description = " C# is tricky, # is special char for RE"
        result = nlp.skill_set(self.jobiri,description,self.skilldict)
        self.assertTrue(len(result)==1)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.csharpIRI) in result)

    # This one fails, You cant put \b to match the empty string
    # without breaking the single letter
    def test_last_character(self):
        description = "This job requires perl"
        result = nlp.skill_set(self.jobiri,description,self.skilldict)
        self.assertTrue(len(result)==1)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.perlIRI) in result)

    def test_from_data(self):
        description = """Do you like games? Would you like you a job where you are
central in making the games that people love to play? Well, the Game
Designer I position will immerse you into slot game design. You will be
essential in helping to create, design, calculate, analyze and process game
ideas which eventually translate into slot games for mobile and desktop play. You
will make sure that the math created for these games is accurate and follows
various jurisdictional regulations. You will work collaboratively other disciplines
(Art, Java, Flash, Audio, and Producer) in a professional manner to see that
the math created and the vision behind the game becomes a reality. Keeping
up with games that are currently in development as well as knowledge of games
in the marketplace will be key in helping to come up with new, innovative,
patentable and viable game ideas. This comes in the form of providing
critiques to other games within the game studio, absorbing and processing
critiques on games that you will create, as well as possibly doing field
research in mobile, online and land casino environments.


Essential Functions:

·
Accountable for the design of multiple IGT games from concept to
market (prototype); participates in designing games including mathematics, provides
feedback on the creative look and feel; demonstrates competency in game design
abilities.

·
Utilizes basic game design, mathematical, and creative skills to
create multiple assigned games for IGT; focuses on the entire scope of game
design elements

·
Works on multiple routine games and game design projects

·
Typically works at least 3 games at a given time

·
Executes the full scope of game design activities that involve
basic creative thinking, industry and competitive knowledge and technical
skills

·
Develops and analyzes game mathematical properties (i.e., pay
tables) and the design of updates and changes to pay tables for assigned game
applications.

·
Utilize knowledge of customer and end user preferences, math
probability theories, play design concepts for gaming machines, design tools
and player preferences such as likes and dislikes.

Qualifications:

·
Bachelor’s degree in Mathematics or related field or equivalent
experience; some work or coursework in probability/combinatorics.

·
Typically has experience in mathematics or game design or
modeling.

·
Must be able to deal with a variety of concrete and some abstract
variables in situations where limited standardization exists.

·
Has basic knowledge of gaming products as well as basic knowledge
of competitors’ and emerging industry products.

·
Strong written and verbal communication skills.

·
Strong analytical skills and problem solving abilities to solve a
variety of problems in an accurate and timely manner.

·
Must be self-directed and able to work independently as well as
part of a dynamic team in a fast-paced environment in order to meet various
deadlines.

·
Solid interpersonal skills in dealing with individuals from a
variety of disciplines.

·
Must be able to travel as needed and be at least 21 years of age.

Plusses:

·
Experience with C/C++, JAVA or Visual Basic programming languages
to help develop more complicated math models.

·
Working knowledge of Microsoft Excel and office productivity
software.

·
Strong enthusiasm for games in general and gambling games in
particular.

First Year Goals:

·
Contribute
to the conceptualizing, design and calculation for multiple product ideas for
the games portfolio.

·
Deliver
mathematical & design documentation for each project and follow its full
implementation through the development process.

·
Playtest
games in production and provide feedback on those games

·
Work
on a team on a data analysis project to gain deeper understanding of our
players and our market"""
        result = nlp.skill_set(self.jobiri,description,self.skilldict)
        self.assertTrue((self.jobiri,ns.edsa.requiresSkill,self.javaIRI) in result)


        
        


if __name__ == '__main__':
    unittest.main()
