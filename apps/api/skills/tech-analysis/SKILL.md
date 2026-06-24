---
name: tech-analysis
description: Typologie-gebaseerde analyse van juridische technologie
version: 1.0.0
execution:
  type: prompt
routing:
  triggers:
    - typologie
    - analyse
    - analyseer
    - technologie
    - juridische technologie
context:
  accepts:
    - page
    - selection
    - typologie
  prefers:
    - page
    - selection
output:
  mode: markdown
---

Analyseer de volgende juridische technologie volgens de typologie voor juridische technologie, met deze prioriteit: (1) typologiekader, (2) externe aanvulling, (3) outputstructuur.

---

CONTEXTBRON:
Gebruik het `typologie.md` als primair analysekader.

Regels voor gebruik van het contextbestand:
- Gebruik de typologie, definities en terminologie uit het bestand als leidend
- Neem classificaties (zoals methode / standaard / tool en juridische taken) over uit het bestand
- Indien terminologie afwijkt van gangbare termen: volg het bestand
- Gebruik externe bronnen alleen als het contextbestand geen informatie bevat over dat punt; externe bronnen vullen aan en overschrijven het contextbestand niet
- Bij conflicterende informatie: geef dit expliciet aan
- Gebruik consistente labels en structuur over meerdere analyses

---

AANVULLENDE BRONNEN:
- Zoek automatisch relevante externe bronnen (officiële documentatie heeft prioriteit)
- Gebruik deze voor feitelijke informatie over de technologie
- Combineer deze met het analysekader uit het bestand

---

TE ANALYSEREN TECHNOLOGIE:

Technologie:
{{naam}}

Extra context (optioneel):
{{beschrijving / use case / bron}}

---

INSTRUCTIES:
- Werk in deze volgorde en behandel eerdere stappen als leidend voor latere stappen:
  1. Haal structuur en classificatiekader uit het contextbestand
  2. Zoek externe bronnen over de technologie
  3. Map alle informatie naar het kader uit het bestand
  4. Vul de template consistent en volledig in

- Gebruik consistente terminologie uit het contextbestand
- Wees concreet en bondig (geen lange teksten)
- Gebruik opsommingen binnen tabelcellen waar mogelijk
- Vermeld expliciet "onbekend" als informatie niet te vinden is

- Classificeer expliciet:
  • methode / standaard / tool  
  • beschouwingsniveau (tekstueel / semantisch / ontologisch / logisch / technisch)  
  • type model (descriptief / normatief)  
  • gebruikers  
  • gebruiksstatus  
  • normstatus  

- Koppel expliciet aan juridische taken uit de typologie  
- Sluit aan bij de beleidscyclus (opstellen → implementatie → uitvoering → evaluatie)
- Neem bij elke bron de volledige, klikbare URL op (beginnend met https://) en gebruik geen verborgen of verkorte links.

---

OUTPUTSTRUCTUUR:

TL;DR:
(maximaal 3 zinnen, inhoudelijk en specifiek)

---

| Onderdeel | Beschrijving |
|----------|-------------|
| Algemene korte beschrijving van de technologie | - Wat is het?<br>- Classificatie: methode / standaard / tool |
| Versie en versiedatum | - Versienummer<br>- Datum |
| Beheerder / leverancier | - Organisatie / community |
| Beoogd gebruik | Een beschrijving van het doel waarvoor de technologie kan worden gebruikt |
| Toegevoegde waarde | - Welk probleem wordt opgelost?<br>- Concrete voordelen |
| Onderdelen | - Componenten / modules / standaarden |
| Kenmerken (typologie) | - Type: methode / standaard / tool<br>- Beschouwingsniveau: ...<br>- Type model: descriptief / normatief<br>- Gebruikers: ...<br>- Gebruiksstatus: ...<br>- Normstatus: ... |
| Juridische taken die worden ondersteund | - Expliciete mapping naar typologie |
| Positie in beleidscyclus | - Opstellen<br>- Implementatie<br>- Uitvoering<br>- Evaluatie |
| Bronverwijzingen | *Antwoord in formaat: title, URL*<br> - Officiële documentatie<br>- Overige bronnen (links)  |