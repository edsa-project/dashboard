# -*- coding: utf-8 -*-
import sys
import requests
import codecs
from datetime import date
from bs4 import BeautifulSoup, SoupStrainer

"""
Adzuna is well structured and API documentation is very good.
We can search by exact phrase and salary is available

There are two shortcomings:
    The API does not pulls the description, we need to go scrape it to the url like with Indeed.
    Cant make a global search, we need to query each country separately. 
    Limited to countries where they have a local site: gb, de, fr, nl, pl
"""

#TODO: Abstract this to a class.
URL="http://api.adzuna.com:80/v1/api/jobs/"


keywords = ['Data Science',
   'Data Scientist',
   'Data Analyst',
   'Data Analysis',
   'Data Engineer',
   'Data Engineering',
   'Data Mining',
   'Big Data']

#keywords = ['Ciencia de Datos',
#    'Científico de datos',
#    'Analista de datos',
#    'análisis de datos',
#    'Ingeniero de datos',
#    'Ingeniería de datos',
#    'Minería de datos',
#    ]

# keywords = ['Science des données',
#   'Scientifique des données',
#   'Analyst des données',
#   'Analyse des données',
#   'Ingenieur des données',
#   'Ingenierie des données',
#   'Fouille des données'
#   ]
countries = [
         'fr','de', 'gb',
         'nl', 'pl' 
        ]


today = date.today()

def get_pages(apiurl,payload,outputfile):
    # do first call
    r = requests.get(apiurl,params=payload)
    print r.text
    outputfile.write(r.text)
    #soup = BeautifulSoup(r.text, "xml")
    #get total results
    #total = int(soup.totalresults.string)
    #print "Going to extract {} results...".format(total)
    # loop for paginate
    #only_results = SoupStrainer("result")
    #for st in range(1,total,25):
    #    page = ''
    #    payload['start'] = st
    #    r = requests.get(URL,params=payload)
    #    soup = BeautifulSoup(r.text, "xml", parse_only=only_results)
    #    outputfile.write(soup.prettify())

def get_country(payload,country,outputfile):
    apiurl = URL + country + "/" + "search/1"
    return get_pages(apiurl,payload,outputfile)

def main(argv):
    for term in keywords:
        f = codecs.open('xmldata/Adzuna-'+term.replace(' ','_')+
            '-'+str(today)+'.xml',mode='a',encoding='utf-8')
        #the minimal payload
        payload = {'app_id' : '65401945',
                'app_key' : '8501ae8fbb78ef5e3e24053e07f3fafd',
                'results_per_page' : 10
                }
        payload['what_phrase'] = term
        for co in countries:
            print "processing "+ co
            get_country(payload,co,f)
        f.close()


if __name__ == "__main__":
   main(sys.argv[1:])

