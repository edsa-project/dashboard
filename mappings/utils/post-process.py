import nlp
from rdflib import Graph
import callkeywords as ck
import sys, argparse

def args_process(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", help="ttl input")
    parser.add_argument("outputfile", 
            help="Name of the output file")
    args = parser.parse_args()
    return args

def main(argv):
    args = args_process(argv)
    dataset = Graph()
    dataset.load(args.dataset, format='turtle')

    keywords = [item for sublist in ck.keywords.values() for item in sublist]
    print keywords

    nlp.clean_non_exact(dataset,keywords)

    dataset.serialize(destination=args.outputfile, format='turtle')


if __name__ == "__main__":
   main(sys.argv[1:])
