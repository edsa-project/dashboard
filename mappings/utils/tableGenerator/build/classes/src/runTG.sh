#To run the table generator

#From an input file. Note the :' ' construction is a multiline comment in bash.

: '
java -jar tableGenerator.jar \
        -inputfile /home/ldig/Dropbox/demand_analysis_datasets/adzuna/adzuna-test-files \
        -skillNames /home/ldig/Dropbox/demand_analysis_datasets/adzuna/skillNames.ttl \
        -countries /home/ldig/Dropbox/demand_analysis_datasets/adzuna/countries_europe.rdf \
        -outputcsv out.csv
'
# On an endpoint
java -jar tableGenerator.jar \
        -endpoint http://localhost:3030/countries/sparql \
        -outputcsv out2.csv

