# -*- coding: utf-8 -*-
import re
import namespaces as ns
from rdflib import Graph
import logging
logging.basicConfig()

def exact_phrase(phrase,description):
    regex = re.compile(phrase,flags=re.I)
    result = regex.search(description)
    if result is None:
        return False
    else:
        return True

def any_exact_phrase(phraseList,description):
    for phrase in phraseList:
        if exact_phrase(phrase,description):
            return True
    return False

def clean_non_exact(dataset,keywordList):
    """ Deletes from the dataset the jobs that do not include in their description
    an exact match of any of the keywords in keywordList
    """

    for job,description in dataset.subject_objects(ns.schema.description):
        title = str(dataset.objects(job,ns.schema.jobtitle))
        if not (any_exact_phrase(keywordList,description) or any_exact_phrase(keywordList,title)):
            dataset.remove((job,None,None))

def skill_set(jobiri,description,skilldict):
    """ Receives a jobiri, a description and a skill dict skillname -> skillIri
    and returns a graph (jobiri,ns.edsa.requiresSkill,skillIRI)
    """
    triples = Graph() 
    for skill in skilldict.keys():
        # Add blanks to avoid substring match
        regskill = skill.replace("#","\#")
        regskill = regskill.replace("+","\+")
        regskill = regskill.replace("$","\$")
        regex = re.compile("[ ,\.;:]"+regskill+"[ ,\.;:]",flags=re.I)
        result = regex.search(description)
        if result:
            #print jobiri +" Requires Skill " + skill
            triples.add((jobiri,ns.edsa.requiresSkill,skilldict[skill]))
    return triples



        





    

