# Get libraries script for Windows PowerShell
# Downloads required JAR files and XSLT stylesheets
# If this fails with certificate errors, use: $ProgressPreference = 'SilentlyContinue'; [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# Create libs directory if it doesn't exist
if (-not (Test-Path 'libs')) {
    New-Item -ItemType Directory -Path 'libs' | Out-Null
}

# Download files
Invoke-WebRequest -Uri 'https://github.com/architolk/rdf2rdf/releases/download/v1.5.0/rdf2rdf.jar' -OutFile 'libs\rdf2rdf.jar' -UseBasicParsing
Invoke-WebRequest -Uri 'https://github.com/architolk/rdf2xml/releases/download/v1.1.0/rdf2xml.jar' -OutFile 'libs\rdf2xml.jar' -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/architolk/rdf2xml/main/skos2md.xsl' -OutFile 'libs\skos2md.xsl' -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/architolk/rdf2xml/main/skos2graphml.xsl' -OutFile 'libs\skos2graphml.xsl' -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/architolk/rdf2xml/main/dct2md.xsl' -OutFile 'libs\dct2md.xsl' -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/architolk/rdf2xml/main/rdf2graphml.xsl' -OutFile 'libs\rdf2graphml.xsl' -UseBasicParsing
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/architolk/rdf2xml/main/rdf2md.xsl' -OutFile 'libs\rdf2md.xsl' -UseBasicParsing
