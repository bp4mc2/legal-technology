## Ontologie

Deze sectie beschrijft de onderliggende ontologie waarmee juridische technologieën worden gemodelleerd.

De ontologie bevat klassen, objecteigenschappen, datatype-eigenschappen en SHACL-shapes. De inhoud van deze sectie is automatisch gegenereerd uit de TBox.

Ontologieversie: `0.2.0`

Datum ontologie: `2026-03-31`

Deze ontologie beschrijft juridische technologieën, hun eigenschappen, relaties en relevante enumeraties.

### Klassen

De volgende klassen zijn opgenomen in de ontologie.

#### Bronverwijzing {#klasse-bronverwijzing}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Bronverwijzing` |


#### Documentatie {#klasse-documentatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Documentatie` |


#### Juridische technologie {#klasse-juridische-technologie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#JuridischeTechnologie` |


#### Methode {#klasse-methode}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Methode` |
| Specialisatie van | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |


#### Ondersteuningsvorm {#klasse-ondersteuningsvorm}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Ondersteuningsvorm` |


#### Organisatie {#klasse-organisatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Organisatie` |


#### Relatie {#klasse-relatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Relatie` |


#### Standaard {#klasse-standaard}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Standaard` |
| Specialisatie van | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |


#### Taakinvulling {#klasse-taakinvulling}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Taakinvulling` |


#### Tool {#klasse-tool}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Tool` |
| Specialisatie van | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |


#### Versiebeschrijving {#klasse-versiebeschrijving}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#Versiebeschrijving` |



### Eigenschappen (relaties)

Deze sectie bevat de objecteigenschappen uit de ontologie. Objecteigenschappen leggen relaties tussen resources, bijvoorbeeld tussen een juridische technologie en een organisatie, status, taak of andere technologie.

#### beheerder {#objecteigenschap-beheerder}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#beheerder` |
| Bereik | Organisatie <br><code>http://bp4mc2.org/lto#Organisatie</code> |

Predicate tussen Methode/Standaard en een herbruikbare Organisatie-resource.

#### beoogde gebruikers {#objecteigenschap-beoogde-gebruikers}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#beoogdeGebruikers` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### beschouwingsniveau {#objecteigenschap-beschouwingsniveau}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#beschouwingsniveau` |
| Domein | Ondersteuningsvorm <br><code>http://bp4mc2.org/lto#Ondersteuningsvorm</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### bron {#objecteigenschap-bron}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#bron` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | Bronverwijzing <br><code>http://bp4mc2.org/lto#Bronverwijzing</code> |


#### documentatie {#objecteigenschap-documentatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#documentatie` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | Documentatie <br><code>http://bp4mc2.org/lto#Documentatie</code> |


#### geboden functionaliteit {#objecteigenschap-geboden-functionaliteit}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#gebodenFunctionaliteit` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### gebruiksstatus {#objecteigenschap-gebruiksstatus}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#gebruiksstatus` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### gerelateerde technologie {#objecteigenschap-gerelateerde-technologie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#gerelateerdeTechnologie` |
| Bereik | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |


#### geschikt voor taak {#objecteigenschap-geschikt-voor-taak}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#geschiktVoorTaak` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | Taakinvulling <br><code>http://bp4mc2.org/lto#Taakinvulling</code> |


#### input product {#objecteigenschap-input-product}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#inputProduct` |
| Domein | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |

Afgeleide inverse relatie tussen een taaktype en een product dat als input dient voor die taak. Deze relatie is bedoeld voor inferentie en queries; de canonieke opslagrichting loopt via lto:inputVoorTaak.

#### input voor taak {#objecteigenschap-input-voor-taak}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#inputVoorTaak` |
| Domein | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |

Canonieke opslagrelatie tussen een product (als skos:Concept in lto:BegrippenkaderProducten) en een taaktype dat het product als input nodig heeft.

#### leverancier {#objecteigenschap-leverancier}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#leverancier` |
| Bereik | Organisatie <br><code>http://bp4mc2.org/lto#Organisatie</code> |

Predicate tussen Tool en een herbruikbare Organisatie-resource.

#### licentievorm {#objecteigenschap-licentievorm}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#licentievorm` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### modelsoort {#objecteigenschap-modelsoort}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#modelsoort` |
| Domein | Ondersteuningsvorm <br><code>http://bp4mc2.org/lto#Ondersteuningsvorm</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### normstatus {#objecteigenschap-normstatus}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#normstatus` |
| Domein | Standaard <br><code>http://bp4mc2.org/lto#Standaard</code> |
| Bereik | None <br><code>http://bp4mc2.org/lt#Normstatussen</code> |

Predicate tussen Standaard en een normstatus uit de Normstatussen-lijst.

#### ondersteuning voor {#objecteigenschap-ondersteuning-voor}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#ondersteuningVoor` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |


#### output product {#objecteigenschap-output-product}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#outputProduct` |
| Domein | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |

Afgeleide inverse relatie tussen een taaktype en een product dat als output ontstaat uit die taak. Deze relatie is bedoeld voor inferentie en queries; de canonieke opslagrichting loopt via lto:outputVanTaak.

#### output van taak {#objecteigenschap-output-van-taak}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#outputVanTaak` |
| Domein | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |

Canonieke opslagrelatie tussen een product (als skos:Concept in lto:BegrippenkaderProducten) en een taaktype dat het product als output produceert.

#### type relatie {#objecteigenschap-type-relatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#typeRelatie` |
| Bereik | None <br><code>http://bp4mc2.org/lt#Relatietypen</code> |


#### type technologie {#objecteigenschap-type-technologie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#typeTechnologie` |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |


#### volgt op {#objecteigenschap-volgt-op}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/ltt#volgtOp` |
| Domein | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |
| Bereik | None <br><code>http://www.w3.org/2004/02/skos/core#Concept</code> |



### Eigenschappen (waarden)

Deze sectie bevat de datatype-eigenschappen uit de ontologie. Datatype-eigenschappen leggen waarden vast, zoals tekst, datum of andere letterlijke waarden.

#### beoogd gebruik {#datatypeeigenschap-beoogd-gebruik}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#beoogdGebruik` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#markdown</code> |


#### beschrijving {#datatypeeigenschap-beschrijving}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#beschrijvingRelatie` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |


#### bijgewerkt op {#datatypeeigenschap-bijgewerkt-op}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#bijgewerktOp` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#date</code> |


#### contactinformatie {#datatypeeigenschap-contactinformatie}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#contactinformatie` |
| Domein | Organisatie <br><code>http://bp4mc2.org/lto#Organisatie</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |


#### naam {#datatypeeigenschap-naam}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#naam` |
| Domein | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |


#### naam {#datatypeeigenschap-naam}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#naamOrganisatie` |
| Domein | Organisatie <br><code>http://bp4mc2.org/lto#Organisatie</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |


#### omschrijving {#datatypeeigenschap-omschrijving}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#omschrijving` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |


#### onderdelen {#datatypeeigenschap-onderdelen}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#onderdelen` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#markdown</code> |


#### ontwikkeling en beheer {#datatypeeigenschap-ontwikkeling-en-beheer}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#ontwikkelingEnBeheer` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#markdown</code> |


#### toegevoegde waarde {#datatypeeigenschap-toegevoegde-waarde}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#toegevoegdeWaarde` |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#markdown</code> |


#### versiedatum {#datatypeeigenschap-versiedatum}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#versiedatum` |
| Domein | Versiebeschrijving <br><code>http://bp4mc2.org/lto#Versiebeschrijving</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#date</code> |

Datum waarop deze versie van de technologie is uitgebracht

#### versienummer {#datatypeeigenschap-versienummer}

| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#versienummer` |
| Domein | Versiebeschrijving <br><code>http://bp4mc2.org/lto#Versiebeschrijving</code> |
| Datatype | None <br><code>http://www.w3.org/2001/XMLSchema#string</code> |

Het versienummer van deze technologieversie, bijv. '1.0', '2.1', etc.


### SHACL-shapes

Deze sectie beschrijft de SHACL-shapes die worden gebruikt om instanties van de ontologie te valideren. Per shape worden de doelklasse en de bijbehorende property-shapes weergegeven.

#### Beschouwingsniveaus {#shape-beschouwingsniveaus}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#BeschouwingsniveausShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb51 | `nb458dd71355740279717bc6377596d0bb51` |  |  | None |


#### Bronverwijzing {#shape-bronverwijzing}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#BronverwijzingShape` |
| Doelklasse | Bronverwijzing <br><code>http://bp4mc2.org/lto#Bronverwijzing</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | titel | `http://purl.org/dc/terms/title` | max. 1 | `http://www.w3.org/2001/XMLSchema#string` | None |
| 2 | locatie | `http://xmlns.com/foaf/0.1/page` | max. 1 | `http://www.w3.org/2001/XMLSchema#anyURI` | None |
| 3 | verwijzing | `http://purl.org/dc/terms/bibliographicCitation` | max. 1 | `http://www.w3.org/2001/XMLSchema#string` | None |


#### Documentatie {#shape-documentatie}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#DocumentatieShape` |
| Doelklasse | Documentatie <br><code>http://bp4mc2.org/lto#Documentatie</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | Beoogd gebruik | `http://bp4mc2.org/lto#beoogdGebruik` | max. 1 | `http://www.w3.org/2001/XMLSchema#markdown` | None |
| 2 | Toegevoegde waarde | `http://bp4mc2.org/lto#toegevoegdeWaarde` | max. 1 | `http://www.w3.org/2001/XMLSchema#markdown` | None |
| 3 | onderdelen | `http://bp4mc2.org/lto#onderdelen` | max. 1 | `http://www.w3.org/2001/XMLSchema#markdown` | None |
| 4 | Ontwikkeling en beheer | `http://bp4mc2.org/lto#ontwikkelingEnBeheer` | max. 1 | `http://www.w3.org/2001/XMLSchema#markdown` | None |


#### Functionaliteiten {#shape-functionaliteiten}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#FunctionaliteitenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb45 | `nb458dd71355740279717bc6377596d0bb45` |  |  | None |


#### Gebruikersgroepen {#shape-gebruikersgroepen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#GebruikersgroepenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb41 | `nb458dd71355740279717bc6377596d0bb41` |  |  | None |


#### Gebruiksstatussen {#shape-gebruiksstatussen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#GebruiksstatusShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb43 | `nb458dd71355740279717bc6377596d0bb43` |  |  | None |


#### Juridische technologie {#shape-juridische-technologie}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#JuridischeTechnologieShape` |
| Doelklasse | Juridische technologie <br><code>http://bp4mc2.org/lto#JuridischeTechnologie</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | naam | `http://bp4mc2.org/lto#naam` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | De naam van de technologie |
| 2 | omschrijving | `http://bp4mc2.org/lto#omschrijving` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | Een omschrijving van de technologie |
| 3 | gebruiksstatus | `http://bp4mc2.org/lto#gebruiksstatus` | min. 1, max. 1 | `http://bp4mc2.org/lto#GebruiksstatusShape` | De status  van het gebruik van de technologie (nog in ontwikkeling, een voorstel, in gebruik, etc) |
| 4 | licentievorm | `http://bp4mc2.org/lto#licentievorm` | min. 1, max. 1 | `http://bp4mc2.org/lto#LicentievormenShape` | De mate waarin de technologie vrij is te gebruiken |
| 5 | geboden functionaliteit | `http://bp4mc2.org/lto#gebodenFunctionaliteit` |  | `http://bp4mc2.org/lto#FunctionaliteitenShape` | Het soort functionaliteit dat de technologie biedt |
| 6 | beoogde gebruikers | `http://bp4mc2.org/lto#beoogdeGebruikers` |  | `http://bp4mc2.org/lto#GebruikersgroepenShape` | De groep van gebruikers die van deze technologie gebruik zou kunnen maken |
| 7 | bijgewerkt op | `http://bp4mc2.org/lto#bijgewerktOp` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#date` | De datum waarop de beschrijving van de technologie voor het laatst is bijgewerkt |
| 8 | ondersteuning voor | `http://bp4mc2.org/lto#ondersteuningVoor` |  | `http://bp4mc2.org/lto#OndersteuningsvormShape` | Het beschouwingsniveau en de modelsoort waarvoor de technologie ondersteuning biedt |
| 100 | geschikt voor taak | `http://bp4mc2.org/lto#geschiktVoorTaak` | min. 1 | `http://bp4mc2.org/lto#Taakinvulling` | Relateert de technologie aan het taaktype waarvoor de technologie kan worden ingezet |
| 101 | beschrijving | `http://bp4mc2.org/lto#documentatie` | max. 1 | `http://bp4mc2.org/lto#DocumentatieShape` | None |
| 102 | aanvullende documentatie | `http://bp4mc2.org/lto#bron` |  | `http://bp4mc2.org/lto#Bronverwijzing` | None |
| 103 | relatie | `http://bp4mc2.org/lto#relatie` |  | `http://bp4mc2.org/lto#Relatie` | None |
| 104 | versiebeschrijving | `http://bp4mc2.org/lto#versiebeschrijving` | min. 1, max. 1 | `http://bp4mc2.org/lto#VersiebeschrijvingShape` | None |


#### Licentievormen {#shape-licentievormen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#LicentievormenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb39 | `nb458dd71355740279717bc6377596d0bb39` |  |  | None |


#### Methode {#shape-methode}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#MethodeShape` |
| Doelklasse | Methode <br><code>http://bp4mc2.org/lto#Methode</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | beheerder | `http://bp4mc2.org/lto#beheerder` | max. 1 | `http://bp4mc2.org/lto#Organisatie` | De organisatie die verantwoordelijk is voor het beheer van de methode. |


#### Modelsoorten {#shape-modelsoorten}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#ModelsoortenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb53 | `nb458dd71355740279717bc6377596d0bb53` |  |  | None |


#### Normstatussen {#shape-normstatussen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#NormstatussenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb49 | `nb458dd71355740279717bc6377596d0bb49` |  |  | None |


#### Ondersteuningsvorm {#shape-ondersteuningsvorm}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#OndersteuningsvormShape` |
| Doelklasse | Ondersteuningsvorm <br><code>http://bp4mc2.org/lto#Ondersteuningsvorm</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | beschouwingsniveau | `http://bp4mc2.org/lto#beschouwingsniveau` | max. 1 | `http://bp4mc2.org/lto#BeschouwingsniveausShape` | None |
| 2 | modelsoort | `http://bp4mc2.org/lto#modelsoort` | max. 1 | `http://bp4mc2.org/lto#ModelsoortenShape` | None |


#### Organisatie {#shape-organisatie}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#OrganisatieShape` |
| Doelklasse | Organisatie <br><code>http://bp4mc2.org/lto#Organisatie</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | naam | `http://bp4mc2.org/lto#naamOrganisatie` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | De naam van de organisatie |
| 2 | contactinformatie | `http://bp4mc2.org/lto#contactinformatie` | max. 1 | `http://www.w3.org/2001/XMLSchema#string` | De contactinformatie van de organisatie |


#### Producten {#shape-producten}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#ProductenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | inScheme | `http://www.w3.org/2004/02/skos/core#inScheme` |  |  | None |


#### Relatie {#shape-relatie}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#RelatieShape` |
| Doelklasse | Relatie <br><code>http://bp4mc2.org/lto#Relatie</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | type relatie | `http://bp4mc2.org/lto#typeRelatie` | min. 1, max. 1 | `http://bp4mc2.org/lto#RelatietypenShape` | None |
| 2 | beschrijving | `http://bp4mc2.org/lto#beschrijvingRelatie` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | None |
| 3 | gerelateerde technologie | `http://bp4mc2.org/lto#gerelateerdeTechnologie` | min. 1, max. 1 | `http://bp4mc2.org/lto#JuridischeTechnologie` | None |


#### Relatietypen {#shape-relatietypen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#RelatietypenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb61 | `nb458dd71355740279717bc6377596d0bb61` |  |  | None |


#### Standaard {#shape-standaard}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#StandaardShape` |
| Doelklasse | Standaard <br><code>http://bp4mc2.org/lto#Standaard</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | beheerder | `http://bp4mc2.org/lto#beheerder` | max. 1 | `http://bp4mc2.org/lto#Organisatie` | De organisatie die verantwoordelijk is voor het beheer van de standaard. |
| 2 | normstatus | `http://bp4mc2.org/lto#normstatus` | max. 1 | `http://bp4mc2.org/lto#NormstatussenShape` | De status van de standaard (bijv. idee, voorstel, best practice, wettelijk). |


#### Taak-productrelaties {#shape-taak-productrelaties}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#TaakProductRelatiesShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | inScheme | `http://www.w3.org/2004/02/skos/core#inScheme` |  |  | None |
| None | nb458dd71355740279717bc6377596d0bb57 | `nb458dd71355740279717bc6377596d0bb57` |  | `http://bp4mc2.org/lto#ProductenShape` | None |
| None | nb458dd71355740279717bc6377596d0bb59 | `nb458dd71355740279717bc6377596d0bb59` |  | `http://bp4mc2.org/lto#ProductenShape` | None |


#### Taakinvulling {#shape-taakinvulling}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#TaakinvullingShape` |
| Doelklasse | Taakinvulling <br><code>http://bp4mc2.org/lto#Taakinvulling</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | omschrijving | `http://bp4mc2.org/lto#omschrijving` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | Een omschrijving hoe de taak wordt ingevuld met behulp van de betreffende technologie |
| 2 | taaktype | `http://bp4mc2.org/lto#taaktype` | min. 1, max. 1 | `http://bp4mc2.org/lto#TaaktypenShape` | Het type taak van deze taakinvulling |


#### Taaktypen {#shape-taaktypen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#TaaktypenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | inScheme | `http://www.w3.org/2004/02/skos/core#inScheme` |  |  | None |


#### Technologietypen {#shape-technologietypen}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#TechnologietypenShape` |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| None | nb458dd71355740279717bc6377596d0bb47 | `nb458dd71355740279717bc6377596d0bb47` |  |  | None |


#### Tool {#shape-tool}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#ToolShape` |
| Doelklasse | Tool <br><code>http://bp4mc2.org/lto#Tool</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | leverancier | `http://bp4mc2.org/lto#leverancier` | max. 1 | `http://bp4mc2.org/lto#Organisatie` | De organisatie die de tool levert. |
| 2 | type technologie | `http://bp4mc2.org/lto#typeTechnologie` |  | `http://bp4mc2.org/lto#TechnologietypenShape` | Het type technologie van de tool (bijv. Markup, DSL, Machine learning). |


#### Versiebeschrijving {#shape-versiebeschrijving}


| Kenmerk | Waarde |
|---|---|
| URI | `http://bp4mc2.org/lto#VersiebeschrijvingShape` |
| Doelklasse | Versiebeschrijving <br><code>http://bp4mc2.org/lto#Versiebeschrijving</code> |

##### Eigenschappen

| Volgorde | Eigenschap | Pad | Verplichting | Waardetype | Beschrijving |
|---:|---|---|---|---|---|
| 1 | versienummer | `http://bp4mc2.org/lto#versienummer` | min. 1, max. 1 | `http://www.w3.org/2001/XMLSchema#string` | None |
| 2 | versiedatum | `http://bp4mc2.org/lto#versiedatum` | max. 1 | `http://www.w3.org/2001/XMLSchema#date` | None |
