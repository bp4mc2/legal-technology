cd model
java -jar ../libs/rdf2xml.jar begrippen.ttl ../media/begrippen.md ../libs/skos2md.xsl
java -jar ../libs/rdf2rdf.jar -p . -i "*.ttl" -o ../pipeline/total.ttl -c ../merge.yaml
cd ..
java -jar libs/rdf2xml.jar pipeline/total.ttl media/total.graphml libs/rdf2graphml.xsl add media/total-edited.graphml
java -jar libs/rdf2xml.jar pipeline/total.ttl media/ontology.md libs/rdf2md.xsl
