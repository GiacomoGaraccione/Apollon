# Prompt per generare una Use Case Diagram reference solution importabile

Da usare in un'interfaccia chat con supporto immagini/PDF e generazione file (es. Claude.ai). Richiede
in input il testo dell'esercizio e uno screenshot/PDF del diagramma dei casi d'uso della soluzione
attesa; produce in output la descrizione degli elementi individuati e un file JSON scaricabile pronto
per il bottone "Import reference" del Solution Creator dell'app (esercizio di tipo Use Case Diagram).

---

```
Sei un assistente che costruisce la soluzione di riferimento COMPLETA per un esercizio di Use Case Diagram, in un formato JSON importabile direttamente in un tool di valutazione automatica - struttura (attori, casi d'uso, sistemi, associazioni, generalizzazioni, include/extend) E sinonimi dei nomi, insieme, in un solo passaggio.

## Cosa ti fornisco

1. Il testo dell'esercizio:
"""
<INCOLLA QUI IL TESTO DELL'ESERCIZIO>
"""
2. Uno screenshot o PDF del diagramma dei casi d'uso della soluzione attesa (attori, casi d'uso, sistemi/confini, associazioni, generalizzazioni tra attori, relazioni Include/Extend).

## Schema di output

{
  "actors": [
    { "name": "<etichetta esatta dell'attore>", "synonyms": ["<sinonimo 1>", "..."], "message": "", "elementId": "Actor_1" }
  ],
  "systems": [
    { "name": "<etichetta esatta del sistema/confine>", "synonyms": ["<sinonimo 1>", "..."], "message": "", "isExternal": false, "elementId": "System_1" }
  ],
  "useCases": [
    { "name": "<etichetta esatta del caso d'uso>", "synonyms": ["<sinonimo 1>", "..."], "message": "", "owner": "<elementId del sistema INTERNO che lo contiene>", "elementId": "UC_1" }
  ],
  "actorUseCaseAssociations": [
    { "sourceId": "<elementId di un attore o di un sistema ESTERNO>", "targetId": "<elementId di un caso d'uso>", "message": "", "isSupportingActor": false }
  ],
  "actorAssociations": [
    { "sourceId": "<elementId dell'attore SPECIALIZZATO>", "targetId": "<elementId dell'attore GENERALIZZATO>", "message": "" }
  ],
  "useCaseAssociations": [
    { "sourceId": "<elementId del caso d'uso source>", "targetId": "<elementId del caso d'uso target>", "message": "", "isExtend": false }
  ],
  "forbiddenActors": [],
  "forbiddenUseCases": [],
  "forbiddenSystems": [],
  "forbiddenActorUseCaseAssociations": [],
  "forbiddenActorAssociations": [],
  "forbiddenUseCaseAssociations": []
}

## Regole

1. Non inventare nulla: genera solo attori/casi d'uso/sistemi/relazioni realmente visibili nel diagramma, con gli stessi nomi esatti. Non correggere eventuali imprecisioni del diagramma, riportale fedelmente.
2. **ATTENZIONE - due convenzioni diverse per sourceId/targetId nello stesso schema, non confonderle:**
   - Nelle liste "buone" (`actorUseCaseAssociations`, `actorAssociations`, `useCaseAssociations`): `sourceId`/`targetId` sono gli `elementId` LOCALI che hai appena inventato per attori/casi d'uso/sistemi in questo stesso JSON (es. "Actor_1", "UC_1"). Devi quindi generare prima tutti gli attori/casi d'uso/sistemi con i loro `elementId`, e solo dopo scrivere le associazioni riusando quegli stessi ID.
   - Nelle liste "forbidden*" con suffisso Association (`forbiddenActorUseCaseAssociations`, `forbiddenActorAssociations`, `forbiddenUseCaseAssociations`): `sourceId`/`targetId` sono invece il NOME esatto dell'elemento (stringa, es. "Admin", "Login"), NON l'elementId. Questa è una scelta di design intenzionale dell'applicazione: le associazioni proibite si riferiscono a elementi per nome, i default in questo schema sono liste vuote - riempile solo se il testo dell'esercizio richiede esplicitamente di vietare certe associazioni.
3. Sistemi (`systems`): `isExternal: false` per un sistema/confine disegnato come rettangolo che CONTIENE casi d'uso al suo interno (il "sistema sotto esame" standard). `isExternal: true` per un sistema esterno che interagisce con i casi d'uso dall'esterno come se fosse un attore (tipicamente disegnato con la stessa icona di un attore o un'etichetta `<<system>>`/`<<external system>>` fuori dal confine) - un sistema esterno non possiede mai casi d'uso (non compare mai come `owner`).
4. Casi d'uso (`useCases`): `owner` deve essere l'`elementId` del sistema INTERNO (quindi con `isExternal: false`) il cui confine racchiude visivamente quel caso d'uso nel diagramma. Se il diagramma ha un solo sistema/confine, tutti i casi d'uso avranno lo stesso `owner`.
5. Attori vs sistemi esterni come source di `actorUseCaseAssociations`: un `sourceId` in questa lista può riferirsi sia a un attore sia a un sistema con `isExternal: true` (entrambi interagiscono con i casi d'uso allo stesso modo); un caso d'uso non è mai il `sourceId`, va sempre nel `targetId`.
6. `actorUseCaseAssociations.isSupportingActor`: `true` solo se nel diagramma è esplicitamente etichettata come relazione di "support"/supporto (un attore che assiste un altro attore nell'eseguire il caso d'uso, entrambi connessi allo stesso caso d'uso). Nella stragrande maggioranza dei casi è `false`.
7. `actorAssociations` (generalizzazione tra attori): rappresenta SEMPRE e SOLO una generalizzazione (freccia UML con punta vuota triangolare). `sourceId` è l'attore più specifico (es. "Amministratore"), `targetId` è l'attore più generale che generalizza (es. "Utente"). Non includere qui nessun'altra associazione tra attori: se nel diagramma due attori sono collegati da una linea che NON è una generalizzazione, è un errore di modellazione del diagramma stesso - riportalo comunque nella descrizione testuale che accompagna il JSON, ma NON aggiungerlo a questa lista (altrimenti verrebbe interpretato come una generalizzazione richiesta che non esiste).
8. `useCaseAssociations` (Include/Extend tra casi d'uso): `isExtend: false` per una relazione Include (freccia tratteggiata con `<<include>>`, `sourceId` = caso d'uso base che include, `targetId` = caso d'uso incluso). `isExtend: true` per una relazione Extend (freccia tratteggiata con `<<extend>>`, `sourceId` = caso d'uso che estende, `targetId` = caso d'uso base che viene esteso).
8bis. **Attenzione particolare ai casi d'uso raggiunti da una relazione Extend**: in questo corso, per convenzione, un caso d'uso che estende un altro caso d'uso (`isExtend: true`) va comunque connesso con una linea diretta all'attore (o sistema esterno) che lo esegue, ESATTAMENTE come un caso d'uso qualsiasi - anche se secondo le convenzioni UML standard questa linea sarebbe ridondante e spesso viene omessa nei diagrammi "da manuale". Se nel diagramma fornito è presente anche questa linea diretta attore→caso d'uso extend, non ometterla "per pulizia" o per conformità a UML da manuale: aggiungila SEMPRE in `actorUseCaseAssociations` insieme alla relazione in `useCaseAssociations`. Questa associazione diretta serve alla valutazione automatica (senza di essa il valutatore non può verificare che lo studente abbia collegato correttamente il caso d'uso extend al proprio attore). Controlla ogni singolo caso d'uso extend uno per uno prima di finalizzare il JSON: è l'errore più comune in questo tipo di generazione.
9. Il nome esatto non va mai ripetuto in `synonyms`: sono due campi separati nello schema. `synonyms` contiene SOLO le alternative.
10. Lingua dei sinonimi: mescola italiano e inglese nello stesso array. Includi forme singolare/plurale, abbreviazioni comuni di dominio e, per gli attori, eventuali ruoli/ title alternativi (es. "Amministratore" / "Admin" / "Amministratrice").
11. `message`: lascia sempre `""`. Richiede un giudizio pedagogico del docente non deducibile dal solo diagramma - lo regola a mano nel form dopo l'import.
12. `elementId`: una stringa locale univoca qualsiasi (es. "Actor_1", "UC_1", "System_1") - non deve corrispondere a nulla nel diagramma originale, serve solo per collegare le associazioni agli elementi all'interno di questo stesso JSON (vedi regola 2).
13. Liste "forbidden*" semplici (`forbiddenActors`, `forbiddenUseCases`, `forbiddenSystems`): array di semplici stringhe con il NOME di un elemento che NON deve apparire nel diagramma dello studente. Lasciale vuote (`[]`) a meno che il testo dell'esercizio richieda esplicitamente di vietare la presenza di determinati attori/casi d'uso/sistemi.

## Formato della risposta

Rispondi in due parti, in quest'ordine:

1. Descrizione degli elementi individuati: un elenco puntato breve, raggruppato per attori/sistemi/casi d'uso/relazioni, e se incerto su qualche dettaglio (es. se un sistema è interno o esterno, se un'associazione tra attori è davvero una generalizzazione) dillo esplicitamente qui.
2. Il JSON completo, come FILE SCARICABILE (usa la funzionalità di generazione file della piattaforma, es. Claude.ai code execution/artifact), non come blocco di testo da copiare a mano. Nominalo in modo descrittivo, es. `use-case-diagram-<nome-esercizio>-reference.json`.
```

---

## Note d'uso

- Il file JSON scaricato va caricato tramite il bottone **"Import reference"** nel Solution Creator dell'esercizio Use Case Diagram — apre il form già compilato con struttura e sinonimi, pronto per preview/rifinitura manuale e salvataggio.
- Verifica sempre la preview generata ("Display reference preview") confrontandola con lo screenshot/PDF originale prima di salvare: il layout automatico non riproduce la disposizione originale, ma attori/casi d'uso/sistemi/associazioni/generalizzazioni/include-extend devono corrispondere esattamente.
- `message` e le liste "forbidden*" sono intenzionalmente lasciati ai default (vuoti): richiedono un giudizio pedagogico non deducibile dal solo diagramma, vanno aggiunti a mano nel form dopo l'import, esattamente come per Class Diagram e BPMN.
- Attenzione alla regola 2 del prompt: è la fonte di errore più probabile. Se un'associazione proibita non viene mai rilevata dal valutatore anche quando lo studente la disegna, controlla per primo che `sourceId`/`targetId` in quella lista siano NOMI e non elementId.
