import requests
import codecs
from datetime import date

"""
StackOverflow is a simple, well structured RSS feed. However, it has
limited flexibility for searchTerms. We need to believe their algorithm of
relevance, and
"""
URL="http://careers.stackoverflow.com/jobs/feed"

keywords = ['Data Science',
    'Data Scientist',
    'Data Analyst',
    'Data Analysis',
    'Data Engineer',
    'Data Engineering',
    'Data Mining',
    'Data Miner']

today = date.today()
for term in keywords:
    payload = {'searchTerm' : term}
    r = requests.get(URL,params=payload)
    f = codecs.open('xmldata/StackOverflow-'+term.replace(' ','_')+
            '-'+str(today)+'.xml',mode='w',encoding='utf-8')
    f.write(r.text)
    f.close()


