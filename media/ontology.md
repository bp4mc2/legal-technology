# Ontologie

## Klassen
- [Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)
  - [Methode](http://bp4mc2.org/lto#Methode)
  - [Standaard](http://bp4mc2.org/lto#Standaard)
  - [Tool](http://bp4mc2.org/lto#Tool)
- [Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)

### Juridische technologie

|URI|http://bp4mc2.org/lto#JuridischeTechnologie|
|-|-|
|Definitie|Een juridische technologie is een methode, standaard of tool die gebruikt wordt in het proces van wetgeving en/of wetsuitvoering|
|Eigenschappen|[beoogde gebruikers](http://bp4mc2.org/lto#beoogdeGebruikers), [geschikt voor taak](http://bp4mc2.org/lto#geschiktVoorTaak), [gebruiksstatus](http://bp4mc2.org/lto#gebruiksstatus), [omschrijving](http://bp4mc2.org/lto#omschrijving), [ondersteuning voor](http://bp4mc2.org/lto#ondersteuningVoor), [licentievorm](http://bp4mc2.org/lto#licentievorm), [aanvullende documentatie](http://bp4mc2.org/lto#bron), [geboden functionaliteit](http://bp4mc2.org/lto#gebodenFunctionaliteit), [bijgewerkt op](http://bp4mc2.org/lto#bijgewerktOp), [beschrijving](http://bp4mc2.org/lto#beschrijving), [naam](http://bp4mc2.org/lto#naam)|

### Methode

|URI|http://bp4mc2.org/lto#Methode|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een methode is een gestructureerde, herhaalbare aanpak (stappenplan met technieken en keuzes) om een doel te bereiken of een taak uit te voeren. Een methode beschrijft hoe je te werk gaat (en evt. In welke volgorde) en kan verwijzen naar standaarden als hulpmiddel|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder)|

### Standaard

|URI|http://bp4mc2.org/lto#Standaard|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een (informatie)standaard is een gedocumenteerde set van afspraken (regels/eisen/definities/specificaties) welke informatie uitgewisseld of vastgelegd wordt om een doel te bereiken of een taak uit te voeren. Een (informatie)standaard beschrijft wat het resultaat is.|
|Eigenschappen|[beheerder](http://bp4mc2.org/lto#beheerder), [normstatus](http://bp4mc2.org/lto#normstatus)|

### Taakinvulling

|URI|http://bp4mc2.org/lto#Taakinvulling|
|-|-|
|Eigenschappen|[type](http://bp4mc2.org/lto#taaktype), [omschrijving](http://bp4mc2.org/lto#omschrijving)|

### Tool

|URI|http://bp4mc2.org/lto#Tool|
|-|-|
|Specialisatie van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|
|Definitie|Een (informatie)standaard is een gedocumenteerde set van afspraken (regels/eisen/definities/specificaties) welke informatie uitgewisseld of vastgelegd wordt om een doel te bereiken of een taak uit te voeren. Een (informatie)standaard beschrijft wat het resultaat is.|
|Eigenschappen|[leverancier](http://bp4mc2.org/lto#leverancier), [type technologie](http://bp4mc2.org/lto#typeTechnologie)|

## Eigenschappen (relaties)

### beheerder

|URI|http://bp4mc2.org/lto#beheerder|
|-|-|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)[Methode](http://bp4mc2.org/lto#Methode)|
|Gerelateerde klasse||

### beoogde gebruikers

|URI|http://bp4mc2.org/lto#beoogdeGebruikers|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### beschouwingsniveau

|URI|http://bp4mc2.org/lto#beschouwingsniveau|
|-|-|
|Eigenschap van||

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
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|
|Gerelateerde klasse||

### licentievorm

|URI|http://bp4mc2.org/lto#licentievorm|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### modelsoort

|URI|http://bp4mc2.org/lto#modelsoort|
|-|-|
|Eigenschap van||

### normstatus

|URI|http://bp4mc2.org/lto#normstatus|
|-|-|
|Eigenschap van|[Standaard](http://bp4mc2.org/lto#Standaard)|

### ondersteuning voor

|URI|http://bp4mc2.org/lto#ondersteuningVoor|
|-|-|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### type technologie

|URI|http://bp4mc2.org/lto#typeTechnologie|
|-|-|
|Eigenschap van|[Tool](http://bp4mc2.org/lto#Tool)|

## Eigenschappen (waarden)

### naam

|URI|http://bp4mc2.org/lto#naam|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)|

### omschrijving

|URI|http://bp4mc2.org/lto#omschrijving|
|-|-|
|Datatype|[string](http://www.w3.org/2001/XMLSchema#string)|
|Eigenschap van|[Juridische technologie](http://bp4mc2.org/lto#JuridischeTechnologie)[Taakinvulling](http://bp4mc2.org/lto#Taakinvulling)|

