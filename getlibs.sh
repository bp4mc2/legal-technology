#
# als dit niet werkt met error "InitializeSecurityContext failed", gebruik dan optie "-k" er bij, om certificate checks over te slaan.
#
curl -L -k https://github.com/architolk/rdf2rdf/releases/download/v1.5.0/rdf2rdf.jar -o libs/rdf2rdf.jar
curl -L -k https://github.com/architolk/rdf2xml/releases/download/v1.1.0/rdf2xml.jar -o libs/rdf2xml.jar
curl -L -k https://raw.githubusercontent.com/architolk/rdf2xml/main/skos2md.xsl -o libs/skos2md.xsl
curl -L -k https://raw.githubusercontent.com/architolk/rdf2xml/main/skos2graphml.xsl -o libs/skos2graphml.xsl
curl -L -k https://raw.githubusercontent.com/architolk/rdf2xml/main/dct2md.xsl -o libs/dct2md.xsl
curl -L -k https://raw.githubusercontent.com/architolk/rdf2xml/main/rdf2graphml.xsl -o libs/rdf2graphml.xsl
curl -L -k https://raw.githubusercontent.com/architolk/rdf2xml/main/rdf2md.xsl -o libs/rdf2md.xsl
