window.ontologyDiagramElements = [
  {
    "data": {
      "id": "Bronverwijzing",
      "label": "Bronverwijzing",
      "uri": "http://bp4mc2.org/lto#Bronverwijzing",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Documentatie",
      "label": "Documentatie",
      "uri": "http://bp4mc2.org/lto#Documentatie",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "JuridischeTechnologie",
      "label": "Juridische technologie",
      "uri": "http://bp4mc2.org/lto#JuridischeTechnologie",
      "type": "class",
      "comment": "",
      "attributes": [
        {
          "label": "bijgewerkt op",
          "range": "date",
          "uri": "http://bp4mc2.org/lto#bijgewerktOp"
        },
        {
          "label": "naam",
          "range": "string",
          "uri": "http://bp4mc2.org/lto#naam"
        }
      ]
    }
  },
  {
    "data": {
      "id": "Methode",
      "label": "Methode",
      "uri": "http://bp4mc2.org/lto#Methode",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Ondersteuningsvorm",
      "label": "Ondersteuningsvorm",
      "uri": "http://bp4mc2.org/lto#Ondersteuningsvorm",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Organisatie",
      "label": "Organisatie",
      "uri": "http://bp4mc2.org/lto#Organisatie",
      "type": "class",
      "comment": "",
      "attributes": [
        {
          "label": "contactinformatie",
          "range": "string",
          "uri": "http://bp4mc2.org/lto#contactinformatie"
        },
        {
          "label": "naam",
          "range": "string",
          "uri": "http://bp4mc2.org/lto#naamOrganisatie"
        }
      ]
    }
  },
  {
    "data": {
      "id": "Relatie",
      "label": "Relatie",
      "uri": "http://bp4mc2.org/lto#Relatie",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Standaard",
      "label": "Standaard",
      "uri": "http://bp4mc2.org/lto#Standaard",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Taakinvulling",
      "label": "Taakinvulling",
      "uri": "http://bp4mc2.org/lto#Taakinvulling",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Tool",
      "label": "Tool",
      "uri": "http://bp4mc2.org/lto#Tool",
      "type": "class",
      "comment": "",
      "attributes": []
    }
  },
  {
    "data": {
      "id": "Versiebeschrijving",
      "label": "Versiebeschrijving",
      "uri": "http://bp4mc2.org/lto#Versiebeschrijving",
      "type": "class",
      "comment": "",
      "attributes": [
        {
          "label": "versiedatum",
          "range": "date",
          "uri": "http://bp4mc2.org/lto#versiedatum"
        },
        {
          "label": "versienummer",
          "range": "string",
          "uri": "http://bp4mc2.org/lto#versienummer"
        }
      ]
    }
  },
  {
    "data": {
      "id": "Methode_subClassOf_JuridischeTechnologie",
      "source": "Methode",
      "target": "JuridischeTechnologie",
      "label": "subClassOf",
      "type": "subClassOf"
    }
  },
  {
    "data": {
      "id": "Standaard_subClassOf_JuridischeTechnologie",
      "source": "Standaard",
      "target": "JuridischeTechnologie",
      "label": "subClassOf",
      "type": "subClassOf"
    }
  },
  {
    "data": {
      "id": "Tool_subClassOf_JuridischeTechnologie",
      "source": "Tool",
      "target": "JuridischeTechnologie",
      "label": "subClassOf",
      "type": "subClassOf"
    }
  },
  {
    "data": {
      "id": "JuridischeTechnologie_bron_Bronverwijzing",
      "source": "JuridischeTechnologie",
      "target": "Bronverwijzing",
      "label": "bron",
      "uri": "http://bp4mc2.org/lto#bron",
      "type": "objectProperty"
    }
  },
  {
    "data": {
      "id": "JuridischeTechnologie_documentatie_Documentatie",
      "source": "JuridischeTechnologie",
      "target": "Documentatie",
      "label": "documentatie",
      "uri": "http://bp4mc2.org/lto#documentatie",
      "type": "objectProperty"
    }
  },
  {
    "data": {
      "id": "JuridischeTechnologie_geschiktVoorTaak_Taakinvulling",
      "source": "JuridischeTechnologie",
      "target": "Taakinvulling",
      "label": "geschikt voor taak",
      "uri": "http://bp4mc2.org/lto#geschiktVoorTaak",
      "type": "objectProperty"
    }
  }
];
