# legal-technology
Vocabulary, ontology and survey of legal technologies

## Generating the documentation

To generate the documentation from the models, use the following steps:

### Prerequisite

- Start `getlibs.sh` to retrieve the libraries and scripts used in the generation pipeline
- Ensure Node.js and npm is installed
- Download and install yEd

### Pipeline

- Start `gen.sh` to generate the corresponding files (markdown and graphml)
- (Optionally) change the diagram visualisation (*.graphml files)
- Export the diagrams to the `/dist` folder as svg files
- Start `build.sh` to build the single html file from the markdown Respec files

The result of the build pipeline can be found in the `/dist` folder
