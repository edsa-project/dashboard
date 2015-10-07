#!/bin/bash

for input in $(ls xmldata/Indeed*)
do
    echo "processing " $input
    temp=${input/xmldata/rdfdata}
    output=${temp/xml/ttl}
    python mapping-Indeed.py $input $output rdfdata/Indeed.ttl --verbose
done

