java -jar libs/rdf2rdf.jar -i "model/juridische technologie.ttl" -i2 "model/taken.ttl" -o pipeline/modelentaken.ttl
java -jar libs/rdf2rdf.jar -i data/all-legal-technologies.ttl -i2 pipeline/modelentaken.ttl -o pipeline/datacheck.ttl -c cleanup.yaml
java -jar libs/rdf2rdf.jar -i pipeline/datacheck.ttl -s "model/juridische technologie.ttl" > data/report.txt
