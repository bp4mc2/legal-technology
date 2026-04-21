java -jar libs/rdf2rdf.jar -i data/all-legal-technologies.ttl -i2 model/taken.ttl -o pipeline/data.ttl
java -jar libs/rdf2xml.jar pipeline/data.ttl media/legal-technologies.graphml lt2graphml.xsl
