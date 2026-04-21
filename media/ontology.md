# Ontologie

## Klassen
- [Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)
  - [Methode](http://bp4mc2.org/lto#Methode)
  - [Standaard](http://bp4mc2.org/lto#Standaard)
  - [Tool](http://bp4mc2.org/lto#Tool)
- [Organisatie](http://bp4mc2.org/lto#Organisatie)
- [Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)

### Juridische technologie

|URI|http://bp4mc2.org/lto#JuridischeTechnologie|
|-|-|
|Definitie|Een juridische technologie is een methode, standaard of tool die gebruikt wordt in het proces van wetgeving en/of wetsuitvoering|
|Eigenschappen|[naam](http://bp4mc2.org/lto#naam), [aanvullende documentatie](http://bp4mc2.org/lto#bron), [geschikt voor taak](http://bp4mc2.org/lto#geschiktVoorTaak), [beschrijving](http://bp4mc2.org/lto#documentatie), [ondersteuning voor](http://bp4mc2.org/lto#ondersteuningVoor), [bijgewerkt op](http://bp4mc2.org/lto#bijgewerktOp), [versiebeschrijving](http://bp4mc2.org/lto#versiebeschrijving), [beoogde gebruikers](http://bp4mc2.org/lto#beoogdeGebruikers), [relatie](http://bp4mc2.org/lto#relatie), [geboden functionaliteit](http://bp4mc2.org/lto#gebodenFunctionaliteit), [omschrijving](http://bp4mc2.org/lto#omschrijving), [licentievorm](http://bp4mc2.org/lto#licentievorm), [gebruiksstatus](http://bp4mc2.org/lto#gebruiksstatus)|

### Methode

|URI|http://bp4mc2.org/lto#Methode|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Subklasse van JuridischeTechnologie. Beschrijft een methode met een beheerder-relatie naar een Organisatie. Een methode is een gestructureerde, herhaalbare aanpak (stappenplan met technieken en keuzes) om een doel te bereiken of een taak uit te voeren. Een methode beschrijft hoe je te werk gaat (en evt. In welke volgorde) en kan verwijzen naar standaarden als hulpmiddel|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder)|

### Organisatie

|URI|http://bp4mc2.org/lto#Organisatie|
|-|-|
|Definitie|Organisatie-instanties worden als herbruikbare resources (IRIs) gemodelleerd en kunnen door meerdere technologieen worden hergebruikt.|
|Eigenschappen|[contactinformatie](http://bp4mc2.org/lto#contactinformatie), [naam](http://bp4mc2.org/lto#naamOrganisatie)|

### Standaard

|URI|http://bp4mc2.org/lto#Standaard|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Subklasse van JuridischeTechnologie. Beschrijft een standaard met een beheerder-relatie naar een Organisatie en normstatus. Een (informatie)standaard is een gedocumenteerde set van afspraken (regels/eisen/definities/specificaties) welke informatie uitgewisseld of vastgelegd wordt om een doel te bereiken of een taak uit te voeren. Een (informatie)standaard beschrijft wat het resultaat is.|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder), [normstatus](http://bp4mc2.org/lto#normstatus)|

### Taakinvulling

|URI|http://bp4mc2.org/lto#Taakinvulling|
|-|-|
|Eigenschappen|[type](http://bp4mc2.org/lto#taaktype), [omschrijving](http://bp4mc2.org/lto#omschrijving)|

### Tool

|URI|http://bp4mc2.org/lto#Tool|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een tool is een informatievoorziening die ondersteuning biedt om een doel te bereiken of een taak uit te voeren. De beschrijving van een tool geeft aan WAARMEE een taak wordt uitgevoerd Subklasse van JuridischeTechnologie. Beschrijft een tool met een leverancier-relatie naar een Organisatie en type technologie.|
|Eigenschappen|[leverancier](http://bp4mc2.org/lto#leverancier), [type technologie](http://bp4mc2.org/lto#typeTechnologie)|

## Eigenschappen (relaties)

### beheerder

|URI|http://bp4mc2.org/lto#beheerder|
|-|-|
|Definitie|Predicate tussen Methode/Standaard en een herbruikbare Organisatie-resource.|
|Eigenschap van|[Methode](http://bp4mc2.org/lto#Methode)[Standaard](http://bp4mc2.org/lto#Standaard)|
|Gerelateerde klasse|[Organisatie](http://bp4mc2.org/lto#Organisatie)|

### beoogde gebruikers

|URI|http://bp4mc2.org/lto#beoogdeGebruikers|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Gerelateerde klasse||

### beschouwingsniveau

|URI|http://bp4mc2.org/lto#beschouwingsniveau|
|-|-|
|Eigenschap van||
|Gerelateerde klasse||

### aanvullende documentatie

|URI|http://bp4mc2.org/lto#bron|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Gerelateerde klasse|[Bronverwijzing](http://bp4mc2.org/lto#Bronverwijzing)|

### beschrijving

|URI|http://bp4mc2.org/lto#documentatie|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### geboden functionaliteit

|URI|http://bp4mc2.org/lto#gebodenFunctionaliteit|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Gerelateerde klasse||

### gebruiksstatus

|URI|http://bp4mc2.org/lto#gebruiksstatus|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Gerelateerde klasse||

### leverancier

|URI|http://bp4mc2.org/lto#leverancier|
|-|-|
|Definitie|Predicate tussen Tool en een herbruikbare Organisatie-resource.|
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|
|Gerelateerde klasse|[Organisatie](http://bp4mc2.org/lto#Organisatie)|

### licentievorm

|URI|http://bp4mc2.org/lto#licentievorm|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### modelsoort

|URI|http://bp4mc2.org/lto#modelsoort|
|-|-|
|Eigenschap van||
|Gerelateerde klasse||

### normstatus

|URI|http://bp4mc2.org/lto#normstatus|
|-|-|
|Definitie|Predicate tussen Standaard en een normstatus uit de Normstatussen-lijst.|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)|
|Gerelateerde klasse||

### ondersteuning voor

|URI|http://bp4mc2.org/lto#ondersteuningVoor|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### type relatie

|URI|http://bp4mc2.org/lto#typeRelatie|
|-|-|
|Eigenschap van||
|Gerelateerde klasse||

### type technologie

|URI|http://bp4mc2.org/lto#typeTechnologie|
|-|-|
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|
|Gerelateerde klasse||

## Eigenschappen (waarden)

### Beoogd gebruik

|URI|http://bp4mc2.org/lto#beoogdGebruik|
|-|-|
|Datatype|[markdown](http://www.w3.org/2001/XMLSchema#markdown)|
|Eigenschap van||

### beschrijving

|URI|http://bp4mc2.org/lto#beschrijvingRelatie|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

### bijgewerkt op

|URI|http://bp4mc2.org/lto#bijgewerktOp|
|-|-|
|Datatype|[date](http://www.w3.org/2001/XMLSchema#date)|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### contactinformatie

|URI|http://bp4mc2.org/lto#contactinformatie|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Organisatie](http://bp4mc2.org/lto#Organisatie)|

### naam

|URI|http://bp4mc2.org/lto#naam|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### naam

|URI|http://bp4mc2.org/lto#naamOrganisatie|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Organisatie](http://bp4mc2.org/lto#Organisatie)|

### omschrijving

|URI|http://bp4mc2.org/lto#omschrijving|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### onderdelen

|URI|http://bp4mc2.org/lto#onderdelen|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

### Ontwikkeling en beheer

|URI|http://bp4mc2.org/lto#ontwikkelingEnBeheer|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

### Toegevoegde waarde

|URI|http://bp4mc2.org/lto#toegevoegdeWaarde|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

### versiedatum

|URI|http://bp4mc2.org/lto#versiedatum|
|-|-|
|Definitie|Datum waarop deze versie van de technologie is uitgebracht|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

### versienummer

|URI|http://bp4mc2.org/lto#versienummer|
|-|-|
|Definitie|Het versienummer van deze technologieversie, bijv. '1.0', '2.1', etc.|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

