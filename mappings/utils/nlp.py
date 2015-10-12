# -*- coding: utf-8 -*-
import re
import namespaces as ns

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




    

