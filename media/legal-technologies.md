---
title: "Juridische technologie ontologie"
shortName: "juridische-technologieen"
status: "ED"
group: "bp4mc2"
editors:
  - name: "Brattinga, Van Dijk, Straver"
---

# Abstract

Deze specificatie beschrijft een catalogus van juridische technologieën.  
De inhoud is automatisch gegenereerd uit RDF/Turtle op basis van de juridische technologie-ontologie.

# Status of This Document

Dit document is gegenereerd uit de Turtle-bronbestanden:

- TBox: `C:\Users\Erwin Straver\projects\wendbare wetsuitvoering\tools\..\model\juridische technologie.ttl`
- ABox: `C:\Users\Erwin Straver\projects\wendbare wetsuitvoering\tools\..\data\all-legal-technologies.ttl`


Versie van de ontologie: `0.1.0`



Aangemaakt op: `2026-03-31`


# Inleiding

Deze catalogus beschrijft juridische technologieën, waaronder methoden, standaarden en tools.  
Per technologie worden kenmerken beschreven zoals gebruiksstatus, licentievorm, functionaliteit, doelgroep, ondersteuning, taken, bronnen en relaties met andere technologieën.

# Leeswijzer

De catalogus bestaat uit de volgende onderdelen:

1. overzicht van juridische technologieën;
2. detailbeschrijvingen per technologie;
3. taxonomieën en waardenlijsten;
4. organisaties;
5. bronnen en relaties.

# Overzicht van juridische technologieën

| Technologie | Type | Status | Licentie | Bijgewerkt op |
|---|---|---|---|---|

| [Akoma Ntoso](#akoma-ntoso) | Standaard | In gebruik | Volledig open | None |

| [Archimate](#archimate) | Standaard | In gebruik | Open onder voorwaarden | 2026-04-14 |

| [Beleidskompas](#beleidskompas) | Methode | In gebruik | Volledig open | 2026-04-13 |

| [Beleidskompas](#beleidskompas) | Methode | In gebruik | Volledig open | 2026-05-15 |

| [BibTeX](#bibtex) | Standaard | In gebruik | Volledig open | None |

| [BPEL - Business Process Execution Language](#bpel-business-process-execution-language) | Methode | In gebruik | Open onder voorwaarden | None |

| [BPMN - Business Process Model and Notation](#bpmn-business-process-model-and-notation) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [BWB](#bwb) | Standaard | In gebruik | Volledig open | 2026-04-13 |

| [Calculemus-Flint](#calculemus-flint) | Methode | Work in progress | Open onder voorwaarden | 2026-05-18 |

| [DEMO - Design & Engineering Methodology for Organizations](#demo-design-engineering-methodology-for-organizations) | Methode | In gebruik | Open onder voorwaarden | None |

| [DMN - Decision Model and Notation](#dmn-decision-model-and-notation) | Standaard | In gebruik | Volledig open | None |

| [DROOLS](#drools) | Tool | In gebruik | Volledig open | None |

| [Dublin Core](#dublin-core) | Standaard | In gebruik | Volledig open | None |

| [ECLI](#ecli) | Standaard | In gebruik | Volledig open | 2026-05-18 |

| [ELI](#eli) | Standaard | In gebruik | Volledig open | 2026-05-17 |

| [Entity–relationship model](#entity-relationship-model) | Standaard | In gebruik | Open onder voorwaarden | None |

| [FBM - Fact-based modelling](#fbm-fact-based-modelling) | Methode | In gebruik | Open onder voorwaarden | 2026-04-14 |

| [FCO-IM - Fully Communication Oriented Information Modeling](#fco-im-fully-communication-oriented-information-modeling) | Methode | In gebruik | Open onder voorwaarden | None |

| [FRBR](#frbr) | Standaard | In gebruik | Volledig open | 2026-05-18 |

| [Handreiking Ketenbusinessanalyse (HKBA)](#handreiking-ketenbusinessanalyse-hkba) | Methode | Voorstel | Volledig open | None |

| [Javascript expressions](#javascript-expressions) | Standaard | In gebruik | Volledig open | None |

| [JCDR](#jcdr) | Standaard | In gebruik | Volledig open | 2026-05-18 |

| [JSON Schema Definition](#json-schema-definition) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [Jurriconnect](#jurriconnect) | Standaard | In gebruik | Volledig open | None |

| [LegalRuleML](#legalruleml) | Standaard | In gebruik | Open onder voorwaarden | None |

| [LIDO](#lido) | Tool | In gebruik | Open onder voorwaarden | None |

| [Markdown](#markdown) | Standaard | In gebruik | Volledig open | None |

| [MIM - Metamodel Informatie Modellering](#mim-metamodel-informatie-modellering) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [NIAM](#niam) | Methode | In gebruik | Open onder voorwaarden | 2026-04-14 |

| [NL-SBB](#nl-sbb) | Standaard | In gebruik | Volledig open | None |

| [NRML](#nrml) | Methode | Work in progress | Volledig open | None |

| [OAS - OpenAPI Specification ](#oas-openapi-specification) | Standaard | In gebruik | Volledig open | None |

| [OCL - Object Constraint Language](#ocl-object-constraint-language) | Standaard | In gebruik | Volledig open | None |

| [Open Fisca](#open-fisca) | Methode | In gebruik | Volledig open | None |

| [ORM - Object-Role Modelling](#orm-object-role-modelling) | Methode | In gebruik | Open onder voorwaarden | None |

| [OWL - Web Ontology Language](#owl-web-ontology-language) | Standaard | In gebruik | Volledig open | None |

| [Petri-net](#petri-net) | Standaard | In gebruik | Open onder voorwaarden | None |

| [Predicatenlogica](#predicatenlogica) | Methode | In gebruik | Volledig open | None |

| [RDF - Resource Description Framework](#rdf-resource-description-framework) | Standaard | In gebruik | Volledig open | None |

| [Regelrecht engine](#regelrecht-engine) | Tool | Work in progress | Volledig open | None |

| [Regelspraak](#regelspraak) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [Regular expression](#regular-expression) | Standaard | In gebruik | Volledig open | None |

| [SBVR - Semantics of Business Vocabulary and Business Rules](#sbvr-semantics-of-business-vocabulary-and-business-rules) | Methode | In gebruik | Open onder voorwaarden | None |

| [SHACL - Shapes Constraint Language](#shacl-shapes-constraint-language) | Standaard | In gebruik | Volledig open | None |

| [SKOS - Simple Knowledge Organization](#skos-simple-knowledge-organization) | Standaard | In gebruik | Volledig open | None |

| [SKOS-LEX](#skos-lex) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [STOP](#stop) | Standaard | In gebruik | Volledig open | None |

| [STTR - Standaard en informatiemodel toepasbare regels](#sttr-standaard-en-informatiemodel-toepasbare-regels) | Standaard | In gebruik | Volledig open | 2026-04-14 |

| [TMAP - Test Management Approach](#tmap-test-management-approach) | Methode | In gebruik | Gesloten | None |

| [TOOI](#tooi) | Standaard | Voorstel | Volledig open | 2026-05-18 |

| [TPOD](#tpod) | Standaard | In gebruik | Volledig open | 2026-05-18 |

| [Uitvoerbaarheidstoets Decentrale Overheden](#uitvoerbaarheidstoets-decentrale-overheden) | Methode | In gebruik | Volledig open | None |

| [UML](#uml) | Standaard | In gebruik | Open onder voorwaarden | 2026-04-14 |

| [Use Cases](#use-cases) | Standaard | In gebruik | Volledig open | None |

| [Web Annotation Data Model](#web-annotation-data-model) | Standaard | In gebruik | Volledig open | None |

| [Wetsanalyse](#wetsanalyse) | Methode | In gebruik | Open onder voorwaarden | 2026-04-14 |

| [WUF](#wuf) | Methode | In gebruik | Volledig open | None |

| [XSD - XML Schema Definition](#xsd-xml-schema-definition) | Standaard | In gebruik | Volledig open | None |


# Technologieën


<section id="akoma-ntoso">

## Akoma Ntoso


Akoma Ntoso (AKN) is een internationale standaard voor het gestructureerd vastleggen en uitwisselen van juridische documenten met behulp van een juridische XML‑vocabulaire.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/aln/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="archimate">

## Archimate


ArchiMate® is een open en onafhankelijke modelleertaal voor Enterprise Architectuur, ontwikkeld door The Open Group, en wordt ondersteund door diverse tools en adviesbureaus. De standaard biedt Enterprise Architects hulpmiddelen om relaties tussen verschillende bedrijfsdomeinen eenduidig te beschrijven, analyseren en visualiseren.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/archimate/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**

- **None**








### Bronnen


- None



</section>

<section id="beleidskompas">

## Beleidskompas


Het Beleidskompas is de centrale werkwijze voor het maken van beleid bij de Rijksoverheid en vervangt het Integraal afwegingskader voor beleid en regelgeving (IAK)


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/beleidskompas/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-13 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="beleidskompas">

## Beleidskompas


Het Beleidskompas is de centrale werkwijze voor het maken van beleid bij de Rijksoverheid en vervangt het Integraal afwegingskader voor beleid en regelgeving (IAK)


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/beleidskompas/v/20240605` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-15 |
| Versienummer | 20240605 |
| Versiedatum | 2024-06-05 |
| Beheerder | Kenniscentrum voor beleid en regelgeving |



### Geboden functionaliteit


- Compliance ondersteuning

- Wetgeving: wetgevingsredactie




### Beoogde gebruikers


- Beleidsmedewerkers

- Wetgevers




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| Tekstueel | Descriptief |




### Geschikt voor taak


- **None**: Bij het opstellen van de wet, dient de beleidskompas gebruikt te worden




### Documentatie




#### Toegevoegde waarde

Het Beleidskompas zorgt dat je vóór het schrijven van regels scherp hebt wat het probleem is, wie geraakt wordt en wat werkt — waardoor regelteksten uiteindelijk gerichter, uitvoerbaarder en beter handhaafbaar zijn.



#### Onderdelen

Probleemanalyse, Doelbepaling, Beleidsopties uitwerken, Gevolgen in kaart brengen & voorkeursoptie kiezen.








### Bronnen


- [Beleidskompas (website)](https://www.kcbr.nl/ontwikkelen-beleid-en-regelgeving/beleidskompas)



</section>

<section id="bibtex">

## BibTeX


BibTeX is zowel een hulpmiddel als een bestandsformaat voor het beschrijven en verwerken van literatuurverwijzingen, meestal in combinatie met LaTeX‑documenten.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/bibtex/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="bpel-business-process-execution-language">

## BPEL - Business Process Execution Language


WS‑BPEL (Web Services Business Process Execution Language), vaak kortweg BPEL genoemd, is een door OASIS vastgestelde standaard voor het uitvoerbaar specificeren van bedrijfsprocessen op basis van webservices. Met BPEL worden acties en proceslogica vastgelegd waarbij processen uitsluitend communiceren via webservice‑interfaces voor het importeren en exporteren van informatie.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/bpel/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="bpmn-business-process-model-and-notation">

## BPMN - Business Process Model and Notation


Business Process Model and Notation (BPMN) is een grafische standaard voor het modelleren en vastleggen van bedrijfsprocessen. De standaard is oorspronkelijk ontwikkeld door de Business Process Management Initiative (BPMI) en wordt sinds 2005 beheerd door de Object Management Group (OMG). Met BPMN 2.0 zijn naast notatie‑ en diagramregels ook uitvoeringssemantiek geïntroduceerd. BPMN is vastgelegd als OMG‑specificatie en tevens genormeerd als ISO 19510.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/bpmn/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="bwb">

## BWB


BWB is een afgesproken tekstvolgorde (syntaxis) voor verwijzingen naar landelijk vastgestelde wetten en regels.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/bwb/v/1.3.1` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-13 |
| Versienummer | 1.3.1 |
| Versiedatum | 2014-10-01 |
| Beheerder | KOOP |
| Normstatus | Wettelijk |



### Geboden functionaliteit


- Compliance ondersteuning

- Wetgeving: modellering van wet- en regelgeving




### Beoogde gebruikers


- Juristen

- Regelanalist

- Wetgevers




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| Semantisch | Descriptief |




### Geschikt voor taak


- **None**: Bij het verzamelen van bronmateriaal kan de BWB verwijzing gebruikt worden om samenhangen regelgeving te verzamelen

- **None**: Bij het opstellen van de regeltekst moet verwijzingen conform BWB in de regeling opgenomen worden.




### Documentatie


#### Beoogd gebruik

- Gestandaardiseerd verwijzen naar wet- en regelgeving (via o.a. BWB‑nummers).
- Uitwisseling van juridische verwijzingen tussen systemen/partijen (niet als pure identifier, maar als betekenisvolle link).
- Ondersteunt verwijzingen naar:
-- specifieke wetstoestanden (consolidaties)
-- of verzamelingen daarvan (bijv. alle versies van een artikel)



#### Toegevoegde waarde

Eenduidigheid & interoperabiliteit, Machineleesbaar & implementeerbaar



#### Onderdelen

Identificatie, type verwijzing, parameters








### Bronnen


- [Forum Standaardisatie (BWB)](https://www.forumstandaardisatie.nl/open-standaarden/bwb)

- [Juriconnect](https://www.juriconnect.nl/)



</section>

<section id="calculemus-flint">

## Calculemus-Flint


Calculemus‑Flint is een combinatie van een methode en een formele taal voor het interpreteren en modelleren van juridische normen. Het maakt juridische regels expliciet en uitlegbaar → formaliseerbaar → (deels) automatiseerbaar.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/flint/v/1.0` |
| Type | Methode |
| Gebruiksstatus | Work in progress |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 1.0 |
| Beheerder | TNO |



### Geboden functionaliteit


- Wetgeving: modellering van wet- en regelgeving




### Beoogde gebruikers


- Beleidsmedewerkers

- Juristen

- Regelanalist




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | None |

| None | None |

| None | Descriptief |

| None | Descriptief |

| None | Normatief |

| None | Normatief |

| Ontologisch | None |

| Ontologisch | None |

| Semantisch | None |

| Semantisch | None |




### Geschikt voor taak


- **None**: vertaling naar formeel model

- **None**: structureren van juridische bronnen

- **None**

- **None**




### Documentatie


#### Beoogd gebruik

- Legal engineering
- Rules-as-Code
- Besluitvorming overheid



#### Toegevoegde waarde

Expliciete en herleidbare interpretatie van normen, Consistentie tussen beleid, wetgeving en uitvoering, Basis voor uitlegbare algoritmen en automatisering



#### Onderdelen

Calculemus-protocol (5 stappen), FLINT-taal








### Bronnen


- [Calculemus-Flint methode](https://regels.overheid.nl/docs/methods/flint/methodebeschrijving/CALCULEMUS_FLINT [regels.overheid.nl])

- [Digitale Overheid projectpagina](https://www.digitaleoverheid.nl/innovatieproject/calculemus-flint/)

- [Nederlandse AI Coalitie use case](https://nlaic.com/pd-use-case/legal-engineering-programma-met-calculemus-flint/)



</section>

<section id="demo-design-engineering-methodology-for-organizations">

## DEMO - Design & Engineering Methodology for Organizations


DEMO is een methodiek voor het ontwerpen, inrichten en onderling koppelen van organisaties. Hierbij staan de 'communicatieve acties' centraal: communicatie is essentieel voor het functioneren van organisaties. Afspraken tussen medewerkers, klanten en toeleveranciers komen immers tot stand door te communiceren. Hetzelfde geldt voor de acceptatie van geleverde resultaten


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/demo/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="dmn-decision-model-and-notation">

## DMN - Decision Model and Notation


Decision Model and Notation (DMN) is een modelleertaal en notatie voor het eenduidig vastleggen van bedrijfsbeslissingen en bedrijfsregels. DMN is leesbaar voor verschillende betrokkenen in besluitvorming, zoals businessprofessionals die regels definiëren en toepassen, en businessanalisten die deze beslissingen analyseren en ontwerpen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/dmn/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="drools">

## DROOLS


Drools is een verzameling projecten gericht op intelligente automatisering en besluitvorming. Het platform biedt onder andere een regelengine gebaseerd op inferentie met forward‑ en backward‑chaining, een DMN‑beslissingsengine en aanvullende componenten. Een regelengine vormt een essentieel bouwblok voor expertsystemen: softwaresystemen die, binnen het domein van kunstmatige intelligentie, het besluitvormingsvermogen van een menselijke expert nabootsen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/drools/v/1.0` |
| Type | Tool |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="dublin-core">

## Dublin Core


Dublin Core is een internationaal erkende metadata‑standaard die bestaat uit 15 kernelementen voor het beschrijven en organiseren van bronnen, zodat deze eenvoudiger vindbaar en beheersbaar zijn.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/dc/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="ecli">

## ECLI


ECLI (European Case Law Identifier) is een informatie-standaard voor het uniform identificeren en ontsluiten van jurisprudentie in Europa. Het ondersteunt vooral taken rond verzamelen, analyseren en verwijzen naar rechterlijke uitspraken.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/ecli/v/20110429` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 20110429 |
| Versiedatum | 2011-04-29 |
| Beheerder | Europese Unie (Raad van de EU) |
| Normstatus | Wettelijk |



### Geboden functionaliteit


- Compliance ondersteuning

- Zoeken: jurisprudentie




### Beoogde gebruikers


- Advocaten

- Juristen

- Opsporingsinstanties

- Rechtbanken




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Normatief |

| Semantisch | None |

| Tekstueel | None |




### Geschikt voor taak


- **None**: koppeling uitspraken aan analyse

- **None**: uniforme toegang tot jurisprudentie




### Documentatie


#### Beoogd gebruik

- Jurisprudentiedatabases
- Juridisch onderzoek  
- Verwijzingen in juridische documenten



#### Toegevoegde waarde

Uniforme citatiestandaard, Betere vindbaarheid



#### Onderdelen

ECLI-identifier structuur, ECLI metadata, ECLI-zoekportaal








### Bronnen


- [ECLI Search (EU portal)](https://e-justice.europa.eu/ecli)

- [Raadsconclusies waarin de invoering wordt aanbevolen van een Europese identificatiecode voor jurisprudentie (ECLI),](https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX%3A52011XG0429%2801%29)

- [Rechtspraak ECLI uitleg](https://www.rechtspraak.nl/Uitspraken/Paginas/ECLI.aspx)



</section>

<section id="eli">

## ELI


ELI is een Europees raamwerk om wetgeving online in een gestandaardiseerd formaat beschikbaar te maken, zodat wetgeving grensoverschrijdend kan worden gevonden, geraadpleegd, uitgewisseld en hergebruikt. Het gebruikt o.a. HTTP-URI’s en metadata voor mens- én machineleesbare identificatie.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/eli/v/1.5` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-17 |
| Versienummer | 1.5 |
| Versiedatum | 2024-03-21 |
| Beheerder | Publications Office of the European Union |
| Normstatus | Wettelijk |



### Geboden functionaliteit


- Compliance ondersteuning

- Wetgeving: modellering van wet- en regelgeving




### Beoogde gebruikers


- Juristen

- Regelanalist

- Wetgevers




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Descriptief |

| Semantisch | None |

| Tekstueel | None |




### Geschikt voor taak


- **None**: Bij het opstellen van de regeltekst dient rekening gehouden te worden met verwijzingen middels ELI




### Documentatie


#### Beoogd gebruik

ELI is bedoeld voor officiële juridische publicatiesystemen, EU-instellingen en lidstaten om wetgeving duurzaam, uniform en machineleesbaar te identificeren en publiceren. Primaire gebruikers van het ELI-model zijn officiële juridische uitgevers van EU-lidstaten, maar het model kan ook door andere organisaties worden gebruikt



#### Toegevoegde waarde

ELI verbetert vindbaarheid, interoperabiliteit, hergebruik en koppeling van wetgeving over grenzen en systemen heen. Het maakt wetgeving geschikt voor linked data, kennisgrafen, metadata-uitwisseling en geautomatiseerde verwerking.



#### Onderdelen

1) web identifiers / HTTP-URI’s voor juridische informatie, 2) metadata-elementen/ontology om wetgeving te beschrijven, en 3) machineleesbare uitwisselformaten voor wetgevingsdata








### Bronnen


- [ELI - European Legislation Identifier](https://eur-lex.europa.eu/content/help/eurlex-content/eli.html?locale=en)



</section>

<section id="entity-relationship-model">

## Entity–relationship model


Een entiteit‑relatiemodel (ER‑model) beschrijft onderling samenhangende objecten binnen een specifiek kennisdomein. Een basaal ER‑model bestaat uit entiteittypen, die de relevante objecten classificeren, en definieert de relaties die tussen instanties van deze entiteiten kunnen bestaan.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/er-model/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="fbm-fact-based-modelling">

## FBM - Fact-based modelling


Fact‑based modelling is een conceptuele modelleertechniek die informatie vastlegt als afzonderlijke feiten in plaats van als traditionele entiteiten en attributen. Elk feit beschrijft een concrete bewering binnen het domein, bijvoorbeeld: “Persoon ‘Barack Obama’ heeft een lengte van ‘1,85 meter’”. Deze feiten worden geordend in facttypen, die de structuur en onderlinge relaties vastleggen en zo leiden tot nauwkeurige en semantisch rijke informatiemodellen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/fbm/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="fco-im-fully-communication-oriented-information-modeling">

## FCO-IM - Fully Communication Oriented Information Modeling


Fully Communication Oriented Information Modeling (FCO‑IM) is een methode voor het opstellen van conceptuele informatiemodellen die zich richt op de communicatieve aspecten van data. De methode modelleert de feiten zoals deze door gebruikers worden uitgewisseld, en behoort daarmee tot de familie van fact‑georiënteerde modelleertechnieken. FCO‑IM wordt veel toegepast en onderwezen in Nederland en daarbuiten, en heeft zijn waarde bewezen in onder meer retail, logistiek, financiële dienstverlening en de zorg. Met hulpmiddelen zoals CaseTalk en Infagon kunnen informatiemodellen worden opgesteld en vertaald naar andere modelvormen, zoals entiteit‑relatiemodellen en UML.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/fco-im/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="frbr">

## FRBR


FRBR (Functional Requirements for Bibliographic Records) is een conceptueel entiteit‑relatiemodel, ontwikkeld door de International Federation of Library Associations and Institutions (IFLA). Het model beschrijft hoe gebruikers bibliografische gegevens kunnen zoeken, vinden en raadplegen vanuit hun perspectief. Door relaties tussen entiteiten expliciet vast te leggen, ondersteunt FRBR een samenhangende en navigeerbare structuur, los van specifieke catalogiseerstandaarden zoals AACR, RDA of ISBD.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/frbr/v/13.3` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 13.3 |
| Versiedatum | 2008-11-15 |
| Beheerder | International Federation of Library Associations and Institutions (IFLA) |
| Normstatus | Best practice |



### Geboden functionaliteit


- Wetgeving: modellering van wet- en regelgeving

- Zoeken: wet- en regelgeving




### Beoogde gebruikers


- Beleidsmedewerkers

- Regelanalist




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Descriptief |

| Ontologisch | None |

| Semantisch | None |




### Geschikt voor taak


- **None**: expliciteren van verschillende verschijningsvormen van regels

- **None**: structureren van bronnen en versies




### Documentatie


#### Beoogd gebruik

- Structureren van informatieobjecten en metadata
- Ondersteunen van informatieontsluiting (zoek-, selectie- en toegangstaken)
- Modelleren van relaties tussen versies en verschijningsvormen van documenten
- In juridische context: modelleren van wetgeving, versies en componenten



#### Toegevoegde waarde

Eenduidige modellering van informatieobjecten, Betere vindbaarheid



#### Onderdelen

Groep 1: Work, Expression, Manifestation, Item (WEMI), Groep 2: persoon, organisatie (actoren), Groep 3: concept, object, gebeurtenis, plaats








### Bronnen


- [FLA Bibliographic Conceptual Models](https://www.ifla.org/ifla-s-bibliographic-conceptual-models)

- [FRBR Model – Library of Congress](https://www.loc.gov/catdir/cpso/frbreng.pdf)

- [Functional Requirements for Bibliographic Records – Wikipedia](https://en.wikipedia.org/wiki/Functional_Requirements_for_Bibliographic_Records)



</section>

<section id="handreiking-ketenbusinessanalyse-hkba">

## Handreiking Ketenbusinessanalyse (HKBA)


et de HKBA kan een zorgvuldige analyse van verantwoordelijkheden tussen ketenpartners worden uitgevoerd, zodat hun onderlinge samenwerking leidt tot betere en beter samenhangende dienstverlening.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/hkba/v/1.0` |
| Type | Methode |
| Gebruiksstatus | Voorstel |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="javascript-expressions">

## Javascript expressions


JavaScript‑expressies zijn geldige code‑eenheden die een waarde opleveren. Er wordt onderscheid gemaakt tussen expressies met bijwerkingen, zoals toekenningen (x = 7), en expressies die uitsluitend evalueren, zoals (3 + 4). Operatoren combineren operanden en bepalen de volgorde van evaluatie. JavaScript ondersteunt een breed scala aan operatoren, waaronder rekenkundige, logische, bitwise, string‑ en ternaire operatoren. Elke operator heeft een eigen prioriteit en kan worden gecombineerd met andere operatoren om complexe expressies te vormen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/js-expr/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="jcdr">

## JCDR


JCDR (JuriConnect Decentrale Regelgeving) is een informatie-standaard voor het uniform verwijzen naar decentrale regelgeving in Nederland.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/jcdr/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 1.0 |
| Versiedatum | 2012-12-07 |
| Beheerder | KOOP |
| Normstatus | Wettelijk |



### Geboden functionaliteit


- Compliance ondersteuning

- Zoeken: wet- en regelgeving




### Beoogde gebruikers


- Beleidsmedewerkers

- Juristen

- Uitvoeringsorganisaties




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Normatief |

| Semantisch | None |

| Tekstueel | None |




### Geschikt voor taak


- **None**: koppeling expliciet en uniform opnemen

- **None**: uniforme toegang tot decentrale regelgeving

- **None**: betrouwbare koppeling tussen documenten




### Documentatie


#### Beoogd gebruik

- Verwijzingen in juridische documenten  
- Publicatieplatforms (DROP, CVDR) 



#### Toegevoegde waarde

Eenduidige identificatie van regelingen, Betere vindbaarheid en herleidbaarheid, Interoperabiliteit tussen systemen



#### Onderdelen

Structuurregels voor identificatie van documenten in CVDR








### Bronnen


- [Forum Standaardisatie – JCDR](https://www.forumstandaardisatie.nl/open-standaarden/jcdr)

- [NORA Online – JCDR](https://www.noraonline.nl/wiki/Jcdr)



</section>

<section id="json-schema-definition">

## JSON Schema Definition


JSON Schema is een declaratieve taal voor het definiëren van de structuur, inhoud en beperkingen van JSON‑data. Het biedt een gestandaardiseerde manier om JSON‑gegevens te valideren en te documenteren, wat zorgt voor consistentie en interoperabiliteit tussen systemen. JSON Schema wordt veel gebruikt bij API’s, configuratiebestanden en datavalidatieprocessen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/jsonp-schema/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="jurriconnect">

## Jurriconnect


Standaard voor identificatie van en verwijzing naar wet- en regelgeving.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/juriconnect/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="legalruleml">

## LegalRuleML


De OASIS LegalRuleML Technical Committee (TC) definieert een uitwisselbare regeltaal voor het juridische domein. Deze standaard ondersteunt het modelleren en automatisch redeneren over juridische regels, en stelt implementaties in staat om juridische argumenten eenduidig te structureren, evalueren en vergelijken met behulp van gestandaardiseerde regelrepresentaties.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/legalruleml/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="lido">

## LIDO


Met LiDO - een databank met miljoenen hyperlinks - kunt u snel inzicht krijgen in de verbanden tussen nationale en Europese regelgeving, uitspraken van Nederlandse en Europese rechters, parlementaire documenten en officiële bekendmakingen. LiDO maakt daartoe onder meer gebruik van intelligente software die tal van citatievormen kan herkennen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/lido/v/1.0` |
| Type | Tool |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="markdown">

## Markdown


De standaard Markdown‑syntaxis is gebruiksvriendelijk en efficiënt. Hiermee kunnen gebruikers eenvoudig opgemaakte tekst schrijven in een platte‑teksteditor, wat het lezen en schrijven vergemakkelijkt. Markdown is gebaseerd op het idee dat de auteur zich kan richten op de inhoud in plaats van op complexe opmaak, waardoor formatteren intuïtief en efficiënt blijft.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/markdown/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="mim-metamodel-informatie-modellering">

## MIM - Metamodel Informatie Modellering


MIM (Metamodel voor Informatie-modellering) beschrijft een gestandaardiseerd metamodel voor het opstellen van informatiemodellen. Het definieert metaklassen, metastructuren en metagegevens als basis voor consistente en vergelijkbare informatiemodellering en maakt hergebruik en gezamenlijke tooling mogelijk.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="niam">

## NIAM


Natural language Information Analysis Method (NIAM) is een informatieanalyse- en datamodelleringmethode, ontwikkeld in de jaren zeventig door Sjir Nijssen en anderen. Kenmerkend is dat de analyse expliciet gebeurt door middel van uitspraken in gesproken taal, en dat de gebruikte modeltechniek verschilt van andere door het explicieter modelleren van rollen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/niam/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="nl-sbb">

## NL-SBB


De standaard voor het beschrijven van begrippen geeft aan hoe begrippen in een begrippenlijst, taxonomie of thesaurus eenduidig worden beschreven. 


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/nlsbb/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="nrml">

## NRML


??


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/nrml/v/1.0` |
| Type | Methode |
| Gebruiksstatus | Work in progress |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="oas-openapi-specification">

## OAS - OpenAPI Specification 


De OpenAPI‑specificatie (OAS) is een standaard voor het taal‑onafhankelijk beschrijven van API’s. Hiermee kunnen zowel mensen als machines de functionaliteit van een service begrijpen zonder toegang tot de broncode of aanvullende documentatie. OpenAPI‑beschrijvingen worden meestal vastgelegd in YAML of JSON en bieden een gestructureerde manier om endpoints, request‑ en responseformaten en authenticatiemethoden te definiëren. De standaard ondersteunt de volledige API‑levenscyclus, van ontwerp tot implementatie, en maakt het mogelijk om documentatie, client libraries en geautomatiseerde tests te genereren.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/oas/v/3.1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 3.1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="ocl-object-constraint-language">

## OCL - Object Constraint Language


De Object Constraint Language (OCL) is een declaratieve taal voor het vastleggen van regels en constraints op UML‑modellen en andere OMG‑meta‑modellen (MOF). OCL maakt het mogelijk om nauwkeurige constraints en objectquery’s te formuleren die niet grafisch in diagrammen kunnen worden uitgedrukt. De taal is onderdeel van de UML‑standaard en vormt een belangrijk element binnen de OMG‑specificatie voor modeltransformaties (QVT).


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/ocl/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="open-fisca">

## Open Fisca


OpenFisca zet wet‑ en regelgeving om in uitvoerbare code. Het platform maakt het mogelijk om belasting‑ en uitkeringsstelsels te modelleren en door te rekenen op basis van wetgeving.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/open-fisca/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="orm-object-role-modelling">

## ORM - Object-Role Modelling


Object‑Role Modeling (ORM) is een conceptuele datamodelleermethode voor het op hoog niveau beschrijven en ontwerpen van informatiesystemen. De nadruk ligt op de betekenis van gegevens en hun onderlinge relaties, in plaats van op technische implementatiedetails.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/orm/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="owl-web-ontology-language">

## OWL - Web Ontology Language


OWL (Web Ontology Language) is een door het W3C ontwikkelde standaard voor het Semantisch Web, waarmee machines webinhoud beter kunnen verwerken en interpreteren. OWL bouwt voort op XML, RDF en RDF Schema (RDFS) en biedt een uitgebreidere woordenschat en formele semantiek voor het definiëren van ontologieën. Met OWL worden betekenissen van begrippen en de relaties daartussen vastgelegd, wat geautomatiseerd redeneren en interoperabiliteit mogelijk maakt.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/owl/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="petri-net">

## Petri-net


Petri‑netten zijn wiskundige modelleertalen voor het beschrijven van gedistribueerde systemen en behoren tot de klasse van discrete‑event dynamische systemen. Een Petri‑net is een gerichte bipartiete graaf met twee soorten elementen: plaatsen (cirkels) en transities (rechthoeken). Plaatsen kunnen tokens bevatten, en een transitie is activeerbaar wanneer alle invoerplaatsen minimaal één token hebben. Net als standaarden zoals UML‑activiteitendiagrammen, BPMN en event‑driven process chains bieden Petri‑netten een grafische notatie voor processen met keuzes, iteraties en gelijktijdigheid. In tegenstelling tot deze standaarden beschikken Petri‑netten over exact gedefinieerde uitvoeringssemantiek en een goed ontwikkelde wiskundige theorie voor procesanalyse.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/petri-net/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="predicatenlogica">

## Predicatenlogica


Predicatenlogica is wiskundig-formele logica waarin expliciet predicaten voorkomen, waarmee eigenschappen van en relaties tussen verzamelingen objecten worden beschreven. Vaak wordt vooral de eerste-orde-predicatenlogica bedoeld


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/predicatenlogica/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="rdf-resource-description-framework">

## RDF - Resource Description Framework


RDF (Resource Description Framework) is een standaardmodel voor het uitwisselen van gegevens op het web. Het ondersteunt het samenvoegen van data, ook wanneer onderliggende schema’s verschillen, en maakt het mogelijk dat schema’s in de tijd evolueren zonder dat alle datagebruikers hoeven te worden aangepast.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/rdf/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="regelrecht-engine">

## Regelrecht engine


Regelrecht maakt Nederlandse wetgeving machine‑leesbaar en uitvoerbaar. Het platform zet juridische teksten om in gestructureerde YAML en voert deze uit als deterministische beslislogica.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/regelrecht-engine/v/1.0` |
| Type | Tool |
| Gebruiksstatus | Work in progress |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="regelspraak">

## Regelspraak


Regelspraak is een standaard voor het modelleren van formele (reken)regels.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/regelspraak/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="regular-expression">

## Regular expression


Een reguliere expressie (afgekort als regex of regexp) is een tekenreeks die een patroon beschrijft om tekst te herkennen. Reguliere expressies worden vaak gebruikt voor zoek‑ en vervangbewerkingen in tekst en voor het valideren van invoer. De onderliggende technieken zijn ontwikkeld binnen de theoretische informatica en de theorie van formele talen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/regex/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="sbvr-semantics-of-business-vocabulary-and-business-rules">

## SBVR - Semantics of Business Vocabulary and Business Rules


Semantics of Business Vocabulary and Business Rules (SBVR) is een door de Object Management Group (OMG) vastgestelde standaard voor het formeel en eenduidig beschrijven van vocabulaire en declaratieve regels in natuurlijke taal. SBVR is bedoeld om complexe compliance‑ en bedrijfsregels, zoals operationele regels, beveiligingsbeleid en wet‑ en regelgeving, te formaliseren zodat deze door computers kunnen worden geïnterpreteerd en toegepast. De standaard vormt een integraal onderdeel van de model‑gedreven architectuur (MDA) van de OMG.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/sbvr/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="shacl-shapes-constraint-language">

## SHACL - Shapes Constraint Language


SHACL (Shapes Constraint Language) is een taal voor het valideren van RDF‑grafen aan de hand van een verzameling voorwaarden. Deze voorwaarden worden vastgelegd als shapes en andere constructies in de vorm van een RDF‑graaf. In SHACL worden de RDF‑grafen met regels shapes graphs genoemd, en de RDF‑grafen die hiertegen worden gevalideerd data graphs. Naast validatie kunnen SHACL‑shapes ook dienen als beschrijving van geldige data, bijvoorbeeld voor het bouwen van gebruikersinterfaces, codegeneratie en dataintegratie.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/shacl/v/20170720` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 20170720 |
| Versiedatum | 2017-07-20 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="skos-simple-knowledge-organization">

## SKOS - Simple Knowledge Organization


SKOS is een verzameling specificaties en standaarden die het gebruik van kennisorganisatiesystemen (KOS), zoals thesauri, classificatieschema’s, trefwoordsystemen en taxonomieën, ondersteunt binnen het raamwerk van het Semantisch Web.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/skos/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="skos-lex">

## SKOS-LEX


De SKOS Legal Extension definieert de klassen en eigenschappen die nodig zijn om juridische begrippen als SKOS‑concepten te modelleren en vast te leggen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/skos-lex/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="stop">

## STOP


De STandaard Officiële Publicaties (STOP) is de standaard die het mogelijk maakt om officiële publicaties en consolideerbare regelgeving van gemeenten, provincies, waterschappen en ministeries op een gestructureerde manier aan te leveren.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/stop/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="sttr-standaard-en-informatiemodel-toepasbare-regels">

## STTR - Standaard en informatiemodel toepasbare regels


De Standaard toepasbare regels (STTR) is een van de standaarden voor het Digitaal Stelsel Omgevingswet (DSO). De STTR en het bijbehorende informatiemodel (IMTR) zijn nodig om toepasbare regels te kunnen publiceren. Ze horen bij het maken en het aanleveren van toepasbare regels aan de Registratie toepasbare regels (RTR). Rijkswaterstaat beheert deze standaard.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/sttr/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**








### Bronnen


- None



</section>

<section id="tmap-test-management-approach">

## TMAP - Test Management Approach


TMAP (Test Management Approach) is een gestructureerde testmethode voor software, ontwikkeld door Sogeti en geïntroduceerd in 1995. De methode biedt een raamwerk voor het plannen, uitvoeren en beheersen van testactiviteiten.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/tmap/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Gesloten |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="tooi">

## TOOI


TOOI (Thesauri en Ontologieën voor Overheidsinformatie) is een semantische informatie-standaard/kennismodel voor het beschrijven van overheidsinformatie. Het biedt een gemeenschappelijke taal (ontologie + thesauri + registers) en ondersteunt vooral begripsdefinitie, semantiek en interoperabiliteit.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/tooi/v/1.3.4` |
| Type | Standaard |
| Gebruiksstatus | Voorstel |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 1.3.4 |
| Versiedatum | 2024-03-01 |
| Beheerder | KOOP |
| Normstatus | Best practice |



### Geboden functionaliteit


- Juridisch expertsysteem




### Beoogde gebruikers


- Beleidsmedewerkers

- Juristen




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Descriptief |

| Ontologisch | None |

| Semantisch | None |




### Geschikt voor taak


- **None**: Uniforme metadata

- **None**: kernfunctie (thesauri en ontologie)




### Documentatie


#### Beoogd gebruik

- Publicatie van wet- en regelgeving  
- Metadata- en datasystemen overheid



#### Toegevoegde waarde

Gemeenschappelijke “taal” voor overheidssystemen, Betere vindbaarheid en interoperabiliteit (FAIR), Persistente identifiers (URI’s) voor concepten en organisaties



#### Onderdelen

Ontologie (conceptueel model in RDF), Thesauri (begrippenlijsten, taxonomieën), Waardelijsten (geversioneerde subsets)








### Bronnen


- [Digitale Overheid community TOOI](https://www.digitaleoverheid.nl/community/tooi-thesauri-en-ontologieen-voor-overheidsinformatie/)

- [TOOI beheerplan](https://standaarden.overheid.nl/tooi/beheerplan/strategie)

- [TOOI documentatie](https://standaarden.overheid.nl/tooi)



</section>

<section id="tpod">

## TPOD


TPOD (Toepassingsprofielen Omgevingsdocumenten) is een informatie-standaard die voorschrijft hoe omgevingsdocumenten moeten worden gestructureerd, geannoteerd en uitgewisseld. Het is een domeinspecifieke invulling van STOP en vormt de brug tussen juridische tekst en digitale uitvoering binnen het DSO.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/tpod/v/3.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Bijgewerkt op | 2026-05-18 |
| Versienummer | 3.0 |
| Versiedatum | 2023-12-27 |
| Beheerder | Geonovum |
| Normstatus | Wettelijk |



### Geboden functionaliteit


- Compliance ondersteuning




### Beoogde gebruikers


- Beleidsmedewerkers

- Juristen

- Regelanalist




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | None |

| None | Descriptief |

| None | Normatief |

| None | Normatief |

| Ontologisch | None |

| Semantisch | None |

| Tekstueel | None |




### Geschikt voor taak


- **None**: definieert welke metadata/annotaties nodig zijn

- **None**: Structuur en tekstemodellen

- **None**: expliciteren regels naar toepasbare structuur




### Documentatie


#### Beoogd gebruik

Toepassingscontext:  
- Omgevingsplan, omgevingsvisie, verordening, projectbesluit
- Publicatie via LVBB en ontsluiting via Omgevingsloket (DSO)



#### Toegevoegde waarde

Uniforme structuur en annotatie van regels  • Koppeling van tekst aan locaties en activiteiten, Maakt regels raadpleegbaar en toepasbaar in DSO



#### Onderdelen

Toepassingsprofielen per documenttype, Annotatieregels, Waardelijsten (IMOW), XML-schema’s voor uitwisseling








### Bronnen


- [Geonovum TPO](https://iplo.nl/digitaal-stelsel/aansluiten/standaarden/stop-tpod-imop/)

- [STOP/TPOD uitleg IPLO](https://iplo.nl/digitaal-stelsel/aansluiten/standaarden/stop-tpod-imop/)

- [Wegwijzer TPOD](https://www.wegwijzertpod.nl/)



</section>

<section id="uitvoerbaarheidstoets-decentrale-overheden">

## Uitvoerbaarheidstoets Decentrale Overheden


Het proces van de UDO helpt om beleid vorm te geven dat uitvoerbaar is en zijn doelen bereikt, of dat nu eigen beleid van het Rijk is of beleid dat volgt uit Europese richtlijnen.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/udo/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="uml">

## UML


De Unified Modeling Language (UML) is een algemene, objectgeoriënteerde, visuele modelleertaal waarmee de architectuur en het ontwerp van een systeem inzichtelijk kunnen worden gemaakt, vergelijkbaar met een blauwdruk. UML bevat notaties voor verschillende typen diagrammen die zich richten op onder andere gedrag, interactie en structuur.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/uml/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**

- **None**

- **None**








### Bronnen


- None



</section>

<section id="use-cases">

## Use Cases


UML Use Cases beschrijven functioneel gedrag van een systeem vanuit het perspectief van de gebruiker. Ze laten zien wat een systeem moet doen, niet hoe het intern is opgebouwd. Use cases worden gebruikt om eisen en verwachtingen helder vast te leggen en te communiceren met zowel technische als niet‑technische stakeholders.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/uc/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="web-annotation-data-model">

## Web Annotation Data Model


Het Web Annotation Data Model beschrijft een gestructureerd model en formaat waarmee annotaties kunnen worden gedeeld en hergebruikt over verschillende hardware‑ en softwareplatforms. Het ondersteunt zowel eenvoudige gebruiksscenario’s als complexere toepassingen, zoals het koppelen van willekeurige inhoud aan specifieke datapunten of aan segmenten van getimede multimedia.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/oa/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="wetsanalyse">

## Wetsanalyse


Wetsanalyse is een methode voor het systematisch ontleden van juridische teksten naar structuur, betekenis en werking. Het richt zich primair op het tekstuele en semantische niveau en ondersteunt vooral de taken analyseren regeltekst en interpreteren en expliciteren.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/wetsanalyse/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Open onder voorwaarden |
| Bijgewerkt op | 2026-04-14 |
| Versienummer | 1.0 |



### Geboden functionaliteit


- Wetgeving: modellering van wet- en regelgeving




### Beoogde gebruikers


- Beleidsmedewerkers

- Juristen

- Regelanalist




### Ondersteuning voor

| Beschouwingsniveau | Modelsoort |
|---|---|

| None | None |

| None | None |

| None | Descriptief |

| None | Descriptief |

| Semantisch | None |

| Tekstueel | None |




### Geschikt voor taak


- **None**: voorbereiding en gedeeltelijke uitvoering

- **None**: input voor verdere formalisering

- **None**: kernactiviteit

- **None**

- **None**: identificatie van relevante termen




### Documentatie


#### Beoogd gebruik

- Systematisch analyseren van wet- en regelgeving
- Identificeren van:
-- normen en rechtsgevolgen
-- voorwaarden / criteria
-- uitzonderingen en verwijzingen
- Voorbereiding voor interpretatie, implementatie of automatisering



#### Toegevoegde waarde

Verhoogt transparantie en begrijpelijkheid, Legt impliciete structuur expliciet vast



#### Onderdelen

Analyse van tekststructuur, - Identificatie van regelcomponenten, Analyse van verwijzingen en samenhang








### Bronnen


- None



</section>

<section id="wuf">

## WUF


??


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/wuf/v/1.0` |
| Type | Methode |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>

<section id="xsd-xml-schema-definition">

## XSD - XML Schema Definition


XSD (XML Schema Definition) is een door het W3C aanbevolen standaard voor het formeel beschrijven van de structuur en inhoud van XML‑documenten. Met XSD kunnen regels worden vastgelegd waaraan een XML‑document moet voldoen om als geldig te worden beschouwd. Daarnaast ondersteunt XSD het toekennen van specifieke datatypen aan elementen, wat na validatie een rijke informatiebasis oplevert die bruikbaar is voor verdere verwerking, zoals validatie, dataconversie en softwareontwikkeling.


| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/legaltech/xsd/v/1.0` |
| Type | Standaard |
| Gebruiksstatus | In gebruik |
| Licentievorm | Volledig open |
| Versienummer | 1.0 |









### Geschikt voor taak


- **None**








### Bronnen


- None



</section>


# Taxonomieën en waardenlijsten


<section id="beschouwingsniveaus">

## Beschouwingsniveaus


Enumeratie van mogelijke beschouwingsniveaus voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Logisch | None |

| Ontologisch | None |

| Semantisch | None |

| Technisch | None |

| Tekstueel | None |



</section>

<section id="functionaliteiten">

## Functionaliteiten


Enumeratie van mogelijke functionaliteiten voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Compliance ondersteuning | Ondersteuning bij het aantoonbaar naleven van wet- en regelgeving en interne normen, inclusief controles, signalering en rapportage. |

| Contract: analyse/redactie/beoordeling | Functionaliteiten voor het analyseren van contractinhoud, het (mede) opstellen/redigeren van bepalingen en het beoordelen (review) van concepten en wijzigingen. |

| Contract: geautomatiseerde contractgeneratie | Het automatisch genereren of samenstellen van een contract op basis van invoer, templates en/of clausulebibliotheken. |

| Geautomatiseerd beslissen | Het (geheel of gedeeltelijk) nemen van besluiten door een geautomatiseerd systeem, al dan niet met rechtsgevolgen voor betrokkenen. |

| Juridisch expertsysteem | Een systeem dat juridische kennis (regels en/of heuristieken) toepast om te adviseren, te kwalificeren of beslissingen/uitkomsten te ondersteunen. |

| Procespraktijk: opstellen van processtukken | Het opstellen en redigeren van processtukken (zoals dagvaarding, verzoekschrift, conclusie, pleitnota en incidentele verzoeken). |

| Procespraktijk: procesanalyse | Analyse van procesvoering en procesgegevens (bijv. doorlooptijden, uitkomsten, proceshandelingen en patronen) ter ondersteuning van processtrategie en dossiersturing. |

| Procespraktijk: voorspelling van rechterlijke uitspraak | Het (statistisch of modelmatig) voorspellen van de waarschijnlijke uitkomst van een procedure of de inhoud/strekking van een rechterlijke uitspraak. |

| Wetgeving: modellering van wet- en regelgeving | Het formaliseren of modelleren van wet- en regelgeving (bijv. als regels, logica, metadata of semantische structuur) ten behoeve van interpretatie, toepassing of automatisering. |

| Wetgeving: uitvoering van wet- en regelgeving | Functionaliteiten gericht op uitvoering of implementatie van wettelijke verplichtingen en, waar bedoeld, ondersteuning bij toezicht en handhaving. |

| Wetgeving: wetgevingsredactie | Het (ondersteunen bij het) opstellen en redigeren van wet- en regelgeving, inclusief structuur, definities, verwijzingen en consistentie. |

| Zoeken: jurisprudentie | Het doorzoeken en ontsluiten van jurisprudentie (uitspraken), inclusief filtering, citaties, vindplaatsen en relevante overwegingen. |

| Zoeken: wet- en regelgeving | Het doorzoeken en ontsluiten van wet- en regelgeving, inclusief consolidaties, historische versies, artikelen/leden en kruisverwijzingen. |



</section>

<section id="gebruikersgroepen">

## Gebruikersgroepen


Enumeratie van mogelijke gebruikersgroepen voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Advocaten | None |

| Beleidsmedewerkers | None |

| Burgers en bedrijven | None |

| Commerciële organisaties | None |

| Juristen | None |

| Opsporingsinstanties | None |

| Rechtbanken | None |

| Regelanalist | None |

| Softwareontwikkelaars | None |

| Uitvoeringsorganisaties | None |

| Wetgevers | None |



</section>

<section id="gebruiksstatussen">

## Gebruiksstatussen


Enumeratie van mogelijke gebruiksstatussen voor juridische technologie.



| Waarde | Definitie |
|---|---|

| In gebruik | None |

| Voorstel | None |

| Work in progress | None |



</section>

<section id="licentievormen">

## Licentievormen


Enumeratie van mogelijke licentievormen voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Gesloten | None |

| Open onder voorwaarden | None |

| Volledig open | None |



</section>

<section id="modelsoorten">

## Modelsoorten


Enumeratie van mogelijke modelsoorten voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Descriptief | None |

| Normatief | None |



</section>

<section id="normstatussen">

## Normstatussen


Enumeratie van mogelijke normstatussen voor juridische technologie.



| Waarde | Definitie |
|---|---|

| Best practice | None |

| Idee | None |

| Industrie | None |

| Voorstel | None |

| Wettelijk | None |



</section>

<section id="relatietypen">

## Relatietypen


Enumeratie van mogelijke relatietypen tussen juridische technologieën.



| Waarde | Definitie |
|---|---|

| Alternatief voor | None |

| Gerelateerd aan | None |

| Vervangt | None |

| Vervolg op | None |



</section>

<section id="technologietypen">

## Technologietypen


Enumeratie van mogelijke technologietypen voor juridische technologie.



| Waarde | Definitie |
|---|---|

| DSL | None |

| Machine learning | None |

| Markup (annotatie) | None |

| Markup (publicatie) | None |

| Regelexecutie | None |



</section>


# Organisaties


<section id="europese-unie-raad-van-de-eu">

## Europese Unie (Raad van de EU)

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/a2938952-581f-4fa3-b4a3-9abcd1822721` |
| Contactinformatie | https://european-union.europa.eu/ |


</section>

<section id="geonovum">

## Geonovum

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/f197cc06-88ae-4b82-a8a8-db9029261e59` |
| Contactinformatie | info@geonovum.nl |


</section>

<section id="international-federation-of-library-associations-and-institutions-ifla">

## International Federation of Library Associations and Institutions (IFLA)

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/91bad084-f0ef-40d6-b929-8fa2fa919b2b` |
| Contactinformatie | https://www.ifla.org/ |


</section>

<section id="juriconnect">

## Juriconnect

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/51ef83a4-f310-42d8-8a47-0817bb3fdb8d` |
| Contactinformatie | info@juriconnect.nl |


</section>

<section id="kenniscentrum-voor-beleid-en-regelgeving">

## Kenniscentrum voor beleid en regelgeving

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/4d4c8c24-532a-4751-8971-1d27c79b0eac` |
| Contactinformatie | info@kcbr.nl |


</section>

<section id="koop">

## KOOP

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/5eff159d-559b-430b-9a82-5a63fbd65e99` |
| Contactinformatie | https://www.koopoverheid.nl/ |


</section>

<section id="publications-office-of-the-european-union">

## Publications Office of the European Union

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/f9f140f4-48f1-448d-8ef2-e02c14031da8` |
| Contactinformatie | https://european-union.europa.eu/contact-eu/write-us_en |


</section>

<section id="tno">

## TNO

| Kenmerk | Waarde |
|---|---|
| URI | `https://data.bp4mc2.org/id/lto/organisatie/8ed6441a-9063-493d-9fca-6cb45a786557` |
| Contactinformatie | www.tno.nl |


</section>


# Bijlage: datamodel

Deze catalogus gebruikt onder meer de volgende hoofdklassen:

- `lto:JuridischeTechnologie`
- `lto:Methode`
- `lto:Standaard`
- `lto:Tool`
- `lto:Organisatie`
- `lto:Taakinvulling`
- `lto:Bronverwijzing`
- `lto:Relatie`
- `lto:Versiebeschrijving`
- `lto:Documentatie`

De waardenlijsten zijn gemodelleerd als `skos:Collection` en `skos:Concept`.

# Bijlage: generatie

Dit document is automatisch gegenereerd. Handmatige wijzigingen in dit Markdown-bestand kunnen bij een volgende generatie worden overschreven.