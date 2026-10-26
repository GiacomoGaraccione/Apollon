# Prompt per generare una Class Diagram reference solution importabile

Da usare in un'interfaccia chat con supporto immagini/PDF e generazione file (es. Claude.ai). Richiede
in input il testo dell'esercizio e uno screenshot/PDF del diagramma delle classi della soluzione
attesa; produce in output la descrizione delle classi individuate e un file JSON scaricabile pronto
per il bottone "Import reference" del Solution Creator dell'app (esercizio di tipo Class Diagram).

---

```
Sei un assistente che costruisce la soluzione di riferimento COMPLETA per un esercizio di Class Diagram, in un formato JSON importabile direttamente in un tool di valutazione automatica - struttura (classi, attributi, associazioni, cardinalità) E sinonimi dei nomi, insieme, in un solo passaggio.

## Cosa ti fornisco

1. Il testo dell'esercizio:
"""
<INCOLLA QUI IL TESTO DELL'ESERCIZIO>
"""
2. Uno screenshot o PDF del diagramma delle classi della soluzione attesa (classi, attributi, tipi, cardinalità, ruoli, stereotipi).

## Schema di output

{
  "classes": [
    {
      "name": "<etichetta esatta della classe nel diagramma>",
      "synonyms": ["<sinonimo 1>", "..."],
      "weight": "STRONG",
      "message": "",
      "forbiddenAttributes": [],
      "type": "<Class|AbstractClass|Interface|Enumeration|IntermediateClass>",
      "elementId": "Class_1",
      "attributes": [
        {
          "name": "<nome attributo, SENZA il tipo>",
          "synonyms": ["<sinonimo 1>", "..."],
          "types": ["<tipo esatto come scritto nel diagramma>"],
          "weight": "STRONG",
          "message": "",
          "allowsForeignKeyName": false,
          "elementId": "Attr_1_1"
        }
      ]
    }
  ],
  "associations": [
    {
      "name": "<etichetta esatta dell'associazione, \"\" se non ha nome>",
      "synonyms": ["<sinonimo 1>", "..."],
      "weight": "STRONG",
      "message": "",
      "type": "<Default|Inheritance|Aggregation|Composition>",
      "elementId": "Assoc_1",
      "source": { "referenceClass": { "name": "<nome della classe source>" }, "role": "<ruolo, \"\" se assente>", "multiplicities": ["<cardinalità esatta, es. \"1\", \"0..*\">"] },
      "target": { "referenceClass": { "name": "<nome della classe target>" }, "role": "<ruolo, \"\" se assente>", "multiplicities": ["<cardinalità esatta>"] }
    }
  ],
  "forbiddenClasses": [],
  "forbiddenAssociations": []
}

## Regole

1. Non inventare nulla: genera solo classi/attributi/associazioni realmente visibili nel diagramma, con gli stessi nomi, tipi, cardinalità e ruoli esatti. Non correggere eventuali imprecisioni del diagramma, riportale fedelmente.
2. `type` della classe: deduci lo stereotipo dalla notazione nel diagramma - testo in corsivo = `AbstractClass`, etichetta `<<interface>>` = `Interface`, `<<enumeration>>` = `Enumeration`, altrimenti `Class`. Se non è chiaramente distinguibile, usa `Class` e segnalalo nella descrizione testuale che accompagna il JSON (vedi "Formato della risposta").
3. Attributi scritti come `nome: tipo` (es. "dataNascita: Date"): `name` è solo la parte PRIMA dei due punti, il tipo va in `types` (array con quella singola stringa). Le classi `Enumeration` di solito non hanno un tipo dopo i due punti: in quel caso lascia `types: []`.
4. `source.referenceClass`/`target.referenceClass`: basta `{"name": "<nome classe>"}` - non serve duplicare l'intero oggetto classe.
5. Associazioni senza etichetta visibile: includi comunque l'associazione (è struttura, non va persa) con `"name": ""` e `"synonyms": []` - non generare sinonimi per un nome che non esiste.
6. Il nome esatto non va mai ripetuto in `synonyms`: sono due campi separati nello schema. `synonyms` contiene SOLO le alternative.
7. Lingua dei sinonimi: mescola italiano e inglese nello stesso array. Includi forme singolare/plurale e abbreviazioni comuni di dominio per classi/attributi. Per un'associazione con un verbo (es. "gestisce", "possiede"), genera il prodotto cartesiano tra i sinonimi del verbo e quelli dell'eventuale parte nominale, in entrambe le lingue.
8. `weight`/`message`/`forbiddenAttributes`/`allowsForeignKeyName`/`forbiddenClasses`/`forbiddenAssociations`: lascia i default mostrati nello schema sopra ("STRONG", "", [], false, [], []). Richiedono un giudizio pedagogico del docente non deducibile dal solo diagramma - li regola a mano nel form dopo l'import.
9. `elementId`: una stringa locale univoca qualsiasi (es. "Class_1", "Attr_1_1", "Assoc_1") - non deve corrispondere a nulla in particolare, serve solo perché il campo è obbligatorio nello schema.
10. Cardinalità e ruoli: riportali esattamente come scritti nel diagramma (es. "1", "0..*", "1..*"); se un capo dell'associazione non ha un ruolo etichettato, `"role": ""`.

## Formato della risposta

Rispondi in due parti, in quest'ordine:

1. Descrizione delle classi individuate: un elenco puntato breve, una riga per classe, con il tipo dedotto (Class/Interface/Enumeration/AbstractClass) e, se incerto su qualche stereotipo o cardinalità, dillo esplicitamente qui.
2. Il JSON completo, come FILE SCARICABILE (usa la funzionalità di generazione file della piattaforma, es. Claude.ai code execution/artifact), non come blocco di testo da copiare a mano. Nominalo in modo descrittivo, es. `class-diagram-<nome-esercizio>-reference.json`.
```

---

## Note d'uso

- Il file JSON scaricato va caricato tramite il bottone **"Import reference"** nel Solution Creator dell'esercizio Class Diagram — apre il form già compilato con struttura e sinonimi, pronto per preview/rifinitura manuale e salvataggio.
- Verifica sempre la preview generata ("Display reference preview") confrontandola con lo screenshot/PDF originale prima di salvare: il layout automatico non riproduce la disposizione originale, ma classi/attributi/associazioni/cardinalità devono corrispondere esattamente.
- `weight`, `message`, `forbiddenAttributes`, `allowsForeignKeyName`, `forbiddenClasses`, `forbiddenAssociations` sono intenzionalmente lasciati ai default: richiedono un giudizio pedagogico non deducibile dal solo diagramma, vanno aggiunti a mano nel form dopo l'import, esattamente come per il BPMN.
