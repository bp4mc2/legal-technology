"""Service for managing lto:Organisatie resources."""

from ..utils.legaltech_utils import build_api_id, parse_tech_iri

from .graphdb_client import sparql_query

def list_capabilities():
    """List all capabilities from GraphDB."""
    sparql = '''
        PREFIX lto: <http://bp4mc2.org/lto#>
        PREFIX ltt: <http://bp4mc2.org/ltt#>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

        SELECT 
        ?taak         
        ?taakLabel 
        ?definition
        ?input ?inputLabel
        ?output ?outputLabel
        ?tech ?techNaam
        ?prevTaak ?prevLabel
        ?taakGroep
        WHERE {

        ?taak skos:inScheme ltt:BegrippenkaderTaken ;
                skos:prefLabel ?taakLabel .

        ?collection a skos:OrderedCollection ;
            skos:prefLabel ?taakGroep ;
            skos:memberList ?lijst .
    
        ?lijst rdf:rest*/rdf:first ?taak .    	
               
        OPTIONAL { ?taak skos:definition ?definition }

        OPTIONAL {
            ?input lto:inputVoorTaak ?taak ;
                skos:prefLabel ?inputLabel .
        }

        OPTIONAL {
            ?output (lto:uitvoerVanTaak | lto:outputVanTaak) ?taak ;
                    skos:prefLabel ?outputLabel .
        }

        OPTIONAL {
            ?tech lto:geschiktVoorTaak ?ti ;
                lto:naam ?techNaam .
            ?ti lto:taaktype ?taak .
        }

        OPTIONAL {
            ?taak ltt:volgtOp ?prevTaak .
            ?prevTaak skos:prefLabel ?prevLabel .
        }
        }
        ORDER BY ?taakLabel
    '''
    
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        
        capabilities = _map_results(bindings)
        capabilities = _enrich(capabilities)

        return capabilities
    except Exception as e:
        print(f"[DEBUG] Exception in list_capabilities: {e}")
        return []

def _map_results(results):
    capabilities = {}

    def ensure_capability(uri, label, definition=None, taskGroup=""):
        if uri not in capabilities:
            
            capabilities[uri] = {
                "uri": uri,
                "label": label,
                "definition": definition,
                "inputs": [],
                "outputs": [],
                "technologies": [],
                "follows": [],
                "taskGroup": taskGroup,
            }
        return capabilities[uri]

    for row in results:
        uri = row["taak"]["value"]
        label = row["taakLabel"]["value"]
        definition = row.get("definition", {}).get("value")
        taakGroep = row.get("taakGroep", {}).get("value", "")

        cap = ensure_capability(uri, label, definition, taakGroep)        

        # Inputs
        if "input" in row:
            obj = {
                "uri": row["input"]["value"],
                "label": row["inputLabel"]["value"]
            }
            if obj not in cap["inputs"]:
                cap["inputs"].append(obj)

        # Outputs
        if "output" in row:
            obj = {
                "uri": row["output"]["value"],
                "label": row["outputLabel"]["value"]
            }
            if obj not in cap["outputs"]:
                cap["outputs"].append(obj)

        # Technologies
        if "tech" in row:
            abbrevation, versienummer = parse_tech_iri(row["tech"]["value"])            
            id = build_api_id(abbrevation, versienummer) if abbrevation and versienummer else ''            
            
            obj = {
                "id": id,
                "iri": row["tech"]["value"],
                "naam": row["techNaam"]["value"]
            }
            if obj not in cap["technologies"]:
                cap["technologies"].append(obj)

        # Follows
        if "prevTaak" in row:
            obj = {
                "uri": row["prevTaak"]["value"],
                "label": row["prevLabel"]["value"]
            }
            if obj not in cap["follows"]:
                cap["follows"].append(obj)

    return list(capabilities.values())

def _enrich(capabilities):

    for cap in capabilities:
        # Derived fields
        cap["hasTechnology"] = len(cap["technologies"]) > 0

        if not cap["technologies"]:
            cap["gaps"] = ["Geen technologie"]
        else:
            cap["gaps"] = []

        # simpele maturity
        if not cap["technologies"]:
            cap["maturity"] = "manual"
        else:
            cap["maturity"] = "assisted"

    return capabilities