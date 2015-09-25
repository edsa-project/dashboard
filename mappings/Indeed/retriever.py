import sys
import requests
import codecs
from datetime import date
from bs4 import BeautifulSoup, SoupStrainer

"""
Indeed is well structured, and seems to index a lot of jobs. It includes the lat
and long of the job, but we do not care about that anymore
There are two shortcomings:
    The API does not pulls the description, we need to go scrape it to the url
    Cant make a global search, we need to query each country separately. 
    Limited to countries where they have a local site.
    Paginates to at most 25 results
"""

#TODO: Abstract this to a class.
URL="http://api.indeed.com/ads/apisearch"

keywords = ['Data Science',
    'Data Scientist',
    'Data Analyst',
    'Data Analysis',
    'Data Engineer',
    'Data Engineering',
    'Data Mining',
    'Data Miner']

#countries = ['us', 'ca' #For comparison purposes
         #'at','be','cz','dk','fi','fr','de','gr','hu', 'gb'
         #'ie', 'it', 'lu', 'nl', 'pl', 'ro', 'es', 'se', 
         #'il', #H2020 partner
         #'ru', 'tr', 'no' # Not europe, but close enough
        #]


today = date.today()

def get_pages(payload,outputfile):
    # do first call
    r = requests.get(URL,payload)
    soup = BeautifulSoup(r.text, "xml")
    #get total results
    total = int(soup.totalresults.string)
    print "Going to extract {} results...".format(total)
    # loop for paginate
    only_results = SoupStrainer("result")
    for st in range(1,total,25):
        page = ''
        payload['start'] = st
        r = requests.get(URL,payload)
        soup = BeautifulSoup(r.text, "xml", parse_only=only_results)
        outputfile.write(soup.prettify())

def get_country(payload,country,outputfile):
    payload['co'] = country
    return get_pages(payload,outputfile)

def main(argv):
    for term in keywords:
        f = codecs.open('xmldata/Indeed-'+term.replace(' ','_')+
            '-'+str(today)+'.xml',mode='a',encoding='utf-8')
        #the minimal payload
        payload = {'publisher' : '2651738605780995',
                'userip' : '1.2.3.4',
                'limit' : '25',
                'v' : 2}
        payload['q'] = term
        for co in countries:
            print "processing "+ co
            get_country(payload,co,f)
        f.close()


if __name__ == "__main__":
   main(sys.argv[1:])

