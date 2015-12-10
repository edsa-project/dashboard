#!/bin/bash

for input in $(ls xmldata/Indeed-*2015-11-*)
do
    echo "processing " $input
    temp=${input/xmldata/rdfdata}
    output=${temp/xml/ttl}
    python mapping-Indeed.py $input $output rdfdata/Indeed-2015-11-11.ttl --verbose
done

