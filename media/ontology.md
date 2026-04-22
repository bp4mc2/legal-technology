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
|Eigenschappen|[geschikt voor taak](http://bp4mc2.org/lto#geschiktVoorTaak), [aanvullende documentatie](http://bp4mc2.org/lto#bron), [licentievorm](http://bp4mc2.org/lto#licentievorm), [gebruiksstatus](http://bp4mc2.org/lto#gebruiksstatus), [beoogde gebruikers](http://bp4mc2.org/lto#beoogdeGebruikers), [versiebeschrijving](http://bp4mc2.org/lto#versiebeschrijving), [relatie](http://bp4mc2.org/lto#relatie), [omschrijving](http://bp4mc2.org/lto#omschrijving), [bijgewerkt op](http://bp4mc2.org/lto#bijgewerktOp), [ondersteuning voor](http://bp4mc2.org/lto#ondersteuningVoor), [geboden functionaliteit](http://bp4mc2.org/lto#gebodenFunctionaliteit), [naam](http://bp4mc2.org/lto#naam), [beschrijving](http://bp4mc2.org/lto#documentatie)|

### Methode

|URI|http://bp4mc2.org/lto#Methode|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een methode is een gestructureerde, herhaalbare aanpak (stappenplan met technieken en keuzes) om een doel te bereiken of een taak uit te voeren. Een methode beschrijft hoe je te werk gaat (en evt. In welke volgorde) en kan verwijzen naar standaarden als hulpmiddel|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder)|

### Organisatie

|URI|http://bp4mc2.org/lto#Organisatie|
|-|-|
|Eigenschappen|[contactinformatie](http://bp4mc2.org/lto#contactinformatie), [naam](http://bp4mc2.org/lto#naamOrganisatie)|

### Standaard

|URI|http://bp4mc2.org/lto#Standaard|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een (informatie)standaard is een gedocumenteerde set van afspraken (regels/eisen/definities/specificaties) welke informatie uitgewisseld of vastgelegd wordt om een doel te bereiken of een taak uit te voeren. Een (informatie)standaard beschrijft wat het resultaat is.|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder), [normstatus](http://bp4mc2.org/lto#normstatus)|

### Taakinvulling

|URI|http://bp4mc2.org/lto#Taakinvulling|
|-|-|
|Eigenschappen|[omschrijving](http://bp4mc2.org/lto#omschrijving), [taaktype](http://bp4mc2.org/lto#taaktype)|

### Tool

|URI|http://bp4mc2.org/lto#Tool|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een tool is een informatievoorziening die ondersteuning biedt om een doel te bereiken of een taak uit te voeren. De beschrijving van een tool geeft aan WAARMEE een taak wordt uitgevoerd|
|Eigenschappen|[type technologie](http://bp4mc2.org/lto#typeTechnologie), [leverancier](http://bp4mc2.org/lto#leverancier)|

## Eigenschappen (relaties)

### beheerder

|URI|http://bp4mc2.org/lto#beheerder|
|-|-|
|Definitie|Predicate tussen Methode/Standaard en een herbruikbare Organisatie-resource.|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)[Methode](http://bp4mc2.org/lto#Methode)|
|Gerelateerde klasse|[Organisatie](http://bp4mc2.org/lto#Organisatie)|

### beoogde gebruikers

|URI|http://bp4mc2.org/lto#beoogdeGebruikers|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### beschouwingsniveau

|URI|http://bp4mc2.org/lto#beschouwingsniveau|
|-|-|
|Eigenschap van|[Ondersteuningsvorm](http://bp4mc2.org/lto#Ondersteuningsvorm)|

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

### gebruiksstatus

|URI|http://bp4mc2.org/lto#gebruiksstatus|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

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
|Eigenschap van|[Ondersteuningsvorm](http://bp4mc2.org/lto#Ondersteuningsvorm)|

### normstatus

|URI|http://bp4mc2.org/lto#normstatus|
|-|-|
|Definitie|Predicate tussen Standaard en een normstatus uit de Normstatussen-lijst.|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)|

### ondersteuning voor

|URI|http://bp4mc2.org/lto#ondersteuningVoor|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### type relatie

|URI|http://bp4mc2.org/lto#typeRelatie|
|-|-|
|Eigenschap van||

### type technologie

|URI|http://bp4mc2.org/lto#typeTechnologie|
|-|-|
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|

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
|Datatype|[date](http://www.w3.org/2001/XMLSchema#date)|
|Eigenschap van||

### versienummer

|URI|http://bp4mc2.org/lto#versienummer|
|-|-|
|Definitie|Het versienummer van deze technologieversie, bijv. '1.0', '2.1', etc.|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van||

