import nlp
from rdflib import Graph, URIRef
import callkeywords as ck
import namespaces as ns
import sys, argparse

def args_process(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", help="ttl input")
    parser.add_argument("outputfile", 
            help="Name of the output file")
    args = parser.parse_args()
    return args

def filter_non_exact(dataset):
    keywords = [item for sublist in ck.keywords.values() for item in sublist]
    print keywords
    nlp.clean_non_exact(dataset,keywords)

def get_skill_dict(skilldataset):
    skd = Graph()
    skd.load(skilldataset,format="turtle")
    skilldict = {}
    for skillIRI, skillName in skd.subject_objects(ns.edsa.lexicalValue):
        skilldict[str(skillName.replace('-',' '))] = skillIRI
    return skilldict

def add_skills(dataset,skilldict):
    for jobiri, description in dataset.subject_objects(ns.schema.jobTitle):
       skills = nlp.skill_set(jobiri,description,skilldict)
       dataset += skills
       
    for jobiri, description in dataset.subject_objects(ns.schema.description):
       skills = nlp.skill_set(jobiri,description,skilldict)
       dataset += skills
    
def main(argv):
    args = args_process(argv)
    dataset = Graph()
    dataset.load(args.dataset)

    #filter_non_exact(dataset)
    skilldict = get_skill_dict("datasets/skillNames.ttl")
    add_skills(dataset,skilldict)
    dataset.serialize(destination=args.outputfile)


if __name__ == "__main__":
   main(sys.argv[1:])
