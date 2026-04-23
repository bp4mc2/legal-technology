# Ontologie

## Klassen
- [Bronverwijzing](http://bp4mc2.org/lto#Bronverwijzing)
- [Documentatie](http://bp4mc2.org/lto#Documentatie)
- [Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)
  - [Methode](http://bp4mc2.org/lto#Methode)
  - [Standaard](http://bp4mc2.org/lto#Standaard)
  - [Tool](http://bp4mc2.org/lto#Tool)
- [Ondersteuningsvorm](http://bp4mc2.org/lto#Ondersteuningsvorm)
- [Organisatie](http://bp4mc2.org/lto#Organisatie)
- [Relatie](http://bp4mc2.org/lto#Relatie)
- [Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)
- [Versiebeschrijving](http://bp4mc2.org/lto#Versiebeschrijving)

### Bronverwijzing

|URI|http://bp4mc2.org/lto#Bronverwijzing|
|-|-|
|Eigenschappen|[verwijzing](http://purl.org/dc/terms/bibliographicCitation), [titel](http://purl.org/dc/terms/title), [locatie](http://xmlns.com/foaf/0.1/page)|

### Documentatie

|URI|http://bp4mc2.org/lto#Documentatie|
|-|-|
|Eigenschappen|[Ontwikkeling en beheer](http://bp4mc2.org/lto#ontwikkelingEnBeheer), [Beoogd gebruik](http://bp4mc2.org/lto#beoogdGebruik), [Toegevoegde waarde](http://bp4mc2.org/lto#toegevoegdeWaarde), [onderdelen](http://bp4mc2.org/lto#onderdelen)|

### Juridische technologie

|URI|http://bp4mc2.org/lto#JuridischeTechnologie|
|-|-|
|Definitie|Een juridische technologie is een methode, standaard of tool die gebruikt wordt in het proces van wetgeving en/of wetsuitvoering|
|Eigenschappen|[bijgewerkt op](http://bp4mc2.org/lto#bijgewerktOp), [ondersteuning voor](http://bp4mc2.org/lto#ondersteuningVoor), [aanvullende documentatie](http://bp4mc2.org/lto#bron), [naam](http://bp4mc2.org/lto#naam), [relatie](http://bp4mc2.org/lto#relatie), [omschrijving](http://bp4mc2.org/lto#omschrijving), [gebruiksstatus](http://bp4mc2.org/lto#gebruiksstatus), [versiebeschrijving](http://bp4mc2.org/lto#versiebeschrijving), [beschrijving](http://bp4mc2.org/lto#documentatie), [licentievorm](http://bp4mc2.org/lto#licentievorm), [beoogde gebruikers](http://bp4mc2.org/lto#beoogdeGebruikers), [geboden functionaliteit](http://bp4mc2.org/lto#gebodenFunctionaliteit), [geschikt voor taak](http://bp4mc2.org/lto#geschiktVoorTaak)|

### Methode

|URI|http://bp4mc2.org/lto#Methode|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een methode is een gestructureerde, herhaalbare aanpak (stappenplan met technieken en keuzes) om een doel te bereiken of een taak uit te voeren. Een methode beschrijft hoe je te werk gaat (en evt. In welke volgorde) en kan verwijzen naar standaarden als hulpmiddel|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder)|

### Ondersteuningsvorm

|URI|http://bp4mc2.org/lto#Ondersteuningsvorm|
|-|-|
|Eigenschappen|[modelsoort](http://bp4mc2.org/lto#modelsoort), [beschouwingsniveau](http://bp4mc2.org/lto#beschouwingsniveau)|

### Organisatie

|URI|http://bp4mc2.org/lto#Organisatie|
|-|-|
|Eigenschappen|[naam](http://bp4mc2.org/lto#naamOrganisatie), [contactinformatie](http://bp4mc2.org/lto#contactinformatie)|

### Relatie

|URI|http://bp4mc2.org/lto#Relatie|
|-|-|
|Eigenschappen|[beschrijving](http://bp4mc2.org/lto#beschrijvingRelatie), [gerelateerde technologie](http://bp4mc2.org/lto#gerelateerdeTechnologie), [type relatie](http://bp4mc2.org/lto#typeRelatie)|

### Standaard

|URI|http://bp4mc2.org/lto#Standaard|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een (informatie)standaard is een gedocumenteerde set van afspraken (regels/eisen/definities/specificaties) welke informatie uitgewisseld of vastgelegd wordt om een doel te bereiken of een taak uit te voeren. Een (informatie)standaard beschrijft wat het resultaat is.|
|Eigenschappen|[normstatus](http://bp4mc2.org/lto#normstatus), [beheerder](http://bp4mc2.org/lto#beheerder)|

### Taakinvulling

|URI|http://bp4mc2.org/lto#Taakinvulling|
|-|-|
|Eigenschappen|[taaktype](http://bp4mc2.org/lto#taaktype), [omschrijving](http://bp4mc2.org/lto#omschrijving)|

### Tool

|URI|http://bp4mc2.org/lto#Tool|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een tool is een informatievoorziening die ondersteuning biedt om een doel te bereiken of een taak uit te voeren. De beschrijving van een tool geeft aan WAARMEE een taak wordt uitgevoerd|
|Eigenschappen|[type technologie](http://bp4mc2.org/lto#typeTechnologie), [leverancier](http://bp4mc2.org/lto#leverancier)|

### Versiebeschrijving

|URI|http://bp4mc2.org/lto#Versiebeschrijving|
|-|-|
|Eigenschappen|[versienummer](http://bp4mc2.org/lto#versienummer), [versiedatum](http://bp4mc2.org/lto#versiedatum)|

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
|Mogelijke waarden||

### beschouwingsniveau

|URI|http://bp4mc2.org/lto#beschouwingsniveau|
|-|-|
|Eigenschap van|[Ondersteuningsvorm](http://bp4mc2.org/lto#Ondersteuningsvorm)|
|Mogelijke waarden||

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
|Mogelijke waarden||

### gebruiksstatus

|URI|http://bp4mc2.org/lto#gebruiksstatus|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Mogelijke waarden||

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
|Mogelijke waarden||

### modelsoort

|URI|http://bp4mc2.org/lto#modelsoort|
|-|-|
|Eigenschap van|[Ondersteuningsvorm](http://bp4mc2.org/lto#Ondersteuningsvorm)|
|Mogelijke waarden||

### normstatus

|URI|http://bp4mc2.org/lto#normstatus|
|-|-|
|Definitie|Predicate tussen Standaard en een normstatus uit de Normstatussen-lijst.|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)|
|Mogelijke waarden||

### ondersteuning voor

|URI|http://bp4mc2.org/lto#ondersteuningVoor|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### type relatie

|URI|http://bp4mc2.org/lto#typeRelatie|
|-|-|
|Eigenschap van|[Relatie](http://bp4mc2.org/lto#Relatie)|
|Mogelijke waarden||

### type technologie

|URI|http://bp4mc2.org/lto#typeTechnologie|
|-|-|
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|
|Mogelijke waarden||

## Eigenschappen (waarden)

### Beoogd gebruik

|URI|http://bp4mc2.org/lto#beoogdGebruik|
|-|-|
|Datatype|[markdown](http://www.w3.org/2001/XMLSchema#markdown)|
|Eigenschap van|[Documentatie](http://bp4mc2.org/lto#Documentatie)|

### beschrijving

|URI|http://bp4mc2.org/lto#beschrijvingRelatie|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Relatie](http://bp4mc2.org/lto#Relatie)|

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
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)[Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)|

### onderdelen

|URI|http://bp4mc2.org/lto#onderdelen|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Documentatie](http://bp4mc2.org/lto#Documentatie)|

### Ontwikkeling en beheer

|URI|http://bp4mc2.org/lto#ontwikkelingEnBeheer|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Documentatie](http://bp4mc2.org/lto#Documentatie)|

### Toegevoegde waarde

|URI|http://bp4mc2.org/lto#toegevoegdeWaarde|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Documentatie](http://bp4mc2.org/lto#Documentatie)|

### versiedatum

|URI|http://bp4mc2.org/lto#versiedatum|
|-|-|
|Definitie|Datum waarop deze versie van de technologie is uitgebracht|
|Datatype|[date](http://www.w3.org/2001/XMLSchema#date)|
|Eigenschap van|[Versiebeschrijving](http://bp4mc2.org/lto#Versiebeschrijving)|

### versienummer

|URI|http://bp4mc2.org/lto#versienummer|
|-|-|
|Definitie|Het versienummer van deze technologieversie, bijv. '1.0', '2.1', etc.|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Versiebeschrijving](http://bp4mc2.org/lto#Versiebeschrijving)|

