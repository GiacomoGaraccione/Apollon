# Prompt per generare una BPMN reference solution importabile

Da usare in un'interfaccia chat con supporto immagini/PDF e generazione file (es. Claude.ai). Richiede
in input il testo dell'esercizio e il PDF del diagramma BPMN della soluzione attesa; produce in output
la descrizione delle process part individuate e un file JSON scaricabile pronto per il bottone
"Import reference" del Solution Creator dell'app.

---

```
Sei un assistente che costruisce la soluzione di riferimento COMPLETA per un esercizio BPMN, in un formato JSON importabile direttamente in un tool di valutazione automatica.

## Cosa ti fornisco

1. Il testo dell'esercizio:
"""
<INCOLLA QUI IL TESTO DELL'ESERCIZIO>
"""
2. Un PDF con il diagramma BPMN della soluzione attesa (pool, lane, task, gateway, eventi, sequence flow, message flow).

## Come suddividere il diagramma in Process Part (fondamentale, leggi con attenzione)

Una ProcessPart NON è "un elemento del diagramma": è una SEZIONE del flusso di esecuzione, cioè un
gruppo di uno o più elementi consecutivi che insieme realizzano un singolo passo/requisito descritto
nel testo dell'esercizio. Una corrispondenza 1 elemento = 1 ProcessPart è quasi sempre SBAGLIATA:
vanifica lo scopo della suddivisione in parti (che serve a valutare "è stato modellato correttamente
questo pezzo di logica di business", non "esiste questo singolo nodo").

Procedi così:
1. Leggi il testo dell'esercizio e individua i passi/requisiti che descrive (di solito frasi o brevi
   paragrafi, ciascuno che descrive un'azione o una decisione di business).
2. Per ciascun passo individuato nel testo, trova nel PDF gli elementi del diagramma che insieme lo
   realizzano (possono essere anche solo 1, ma più spesso sono 2-4: un task seguito dal gateway che ne
   valuta l'esito, due task in parallelo con il loro gateway di sincronizzazione, un task e il suo
   boundary event, ecc.).
3. Quegli elementi diventano gli `elements` di UN'UNICA ProcessPart, nell'ordine in cui vengono eseguiti
   (usa `previousElements` per l'ordine INTERNO al gruppo, con id locali al gruppo stesso).
4. Gateway "di infrastruttura" senza legame diretto con un requisito del testo (uno split/join puramente
   tecnico) possono stare nella stessa ProcessPart dell'elemento a cui sono immediatamente legati,
   invece di formare una parte a sé — usa buon senso, l'obiettivo è che ogni ProcessPart abbia un senso
   compiuto per chi legge l'elenco delle parti, non che sia minuscola.
5. Un task e un suo boundary event DEVONO stare nella STESSA ProcessPart (nello stesso gruppo): il
   collegamento `attachedTo`/`attacher` funziona solo tra elementi dello stesso gruppo (vedi sotto).
6. Il numero di ProcessPart finale deve essere sensibilmente inferiore al numero di elementi nel
   diagramma, e deve rispecchiare la struttura del testo (tanti passi quanti ne descrive l'esercizio),
   non la struttura del disegno.

## Lingua

Ogni lista di sinonimi (allowedNames dei pool/lane, names degli elementi) deve contenere frasi sia in italiano che in inglese, mescolate nello stesso array. Per gli elementi con struttura verbo+sostantivo, genera l'intero prodotto cartesiano tra sinonimi del verbo e sinonimi del sostantivo (con e senza articolo, forma infinito e forma sostantivata), in entrambe le lingue.

## Regola speciale per le lane

Le lane rappresentano quasi sempre un attore UMANO (una persona o un ruolo), anche quando il nome scritto nel diagramma sembra riferirsi a un ufficio/sistema/organizzazione. Quando generi `allowedNames` per una lane, NON includere varianti tipo "sistema", "ufficio", "servizio", "piattaforma" o simili — genera solo sinonimi che si riferiscono al ruolo/persona responsabile di quell'attività. Questa restrizione vale SOLO per le lane: per i pool (che rappresentano l'intera organizzazione/sistema esterno) puoi includere normalmente termini come "sistema", "ufficio", "servizio" quando ha senso.

## Message flow (messageTo / messageFrom)

Nel PDF, un message flow è una freccia tratteggiata (spesso con un'icona a busta) che collega elementi
di POOL DIVERSI - a differenza delle sequence flow (linee continue), che collegano solo elementi dello
stesso processo/pool. Per ogni message flow che vedi:
- sull'elemento SORGENTE della freccia, aggiungi una entry in `messageTo`;
- sull'elemento DESTINAZIONE della freccia, aggiungi una entry in `messageFrom`;
- se l'altro capo della freccia è un elemento che hai modellato come parte di una ProcessPart in
  QUESTA reference, usa `{ "type": "Part", "name": "<nome della ProcessPart che contiene quell'elemento>" }`;
- se l'altro capo è dentro un pool esterno che NON stai modellando in dettaglio (un pool "black box",
  spesso disegnato collassato), usa `{ "type": "Pool", "name": "<nome del pool>" }`.
Se il diagramma non ha nessun message flow, lascia `messageTo`/`messageFrom` come `[]` per tutti gli elementi - non inventarne.

## Subprocess

Un subprocess è un rettangolo con gli angoli arrotondati DISEGNATO DENTRO un pool (a volte dentro una
lane), che a sua volta contiene un mini-flusso proprio (altri task/gateway/eventi al suo interno). Se
il bordo del rettangolo è TRATTEGGIATO, è un "event subprocess": non fa parte del flusso sequenziale
normale, scatta quando si verifica l'evento del suo start event interno (che avrà quindi sempre
un'icona di evento - messaggio, timer, errore, segnale - non uno start event "vuoto").

Se nel PDF vedi un subprocess:
1. Aggiungi una entry nell'array `subProcesses` (vedi formato sotto): `name` (etichetta del
   rettangolo), `isEvent` (true se bordo tratteggiato/event subprocess, false per un subprocess
   "normale" incorporato nel flusso), `isInterrupting` (solo se `isEvent` è true: guarda il cerchio
   del suo start event interno - **singolo** = interrompente/`true`, **doppio** = non
   interrompente/`false`; se non riesci a distinguerlo dal PDF lascia `null`, NON indovinare) e
   `parent: { "type": "Pool", "name": "<pool che lo contiene>" }`.
2. Per ogni GroupElement che rappresenta un elemento disegnato DENTRO quel rettangolo, imposta il suo
   `parent` a `{ "type": "SubProcess", "name": "<nome del subprocess>" }` invece di `{"type":"Pool", ...}`.
   Il resto delle regole non cambia: raggruppa comunque questi elementi in ProcessPart "per passo del
   testo" esattamente come per gli elementi direttamente nel pool (un subprocess NON è
   automaticamente un'unica ProcessPart - se contiene più di un passo logico, dividilo in più
   ProcessPart come faresti per qualunque altra sezione del diagramma).
3. Le lane DENTRO un subprocess non sono supportate: se il subprocess ha una propria suddivisione in
   lane nel PDF, ignorala e lascia `actor` dei suoi elementi uguale alla lane esterna in cui è
   disegnato il rettangolo del subprocess (o `null` se il subprocess non è dentro nessuna lane).
4. Un solo livello di annidamento è supportato: se un subprocess contiene a sua volta un ALTRO
   subprocess, non modellare quello più interno come un subprocess separato - tratta i suoi elementi
   come se appartenessero direttamente al subprocess più esterno, e segnala questa semplificazione
   nella sezione "Descrizione delle process part individuate" (vedi sotto), così chi legge sa che è
   stata una scelta deliberata.
5. Se non ci sono subprocess nel diagramma, lascia `subProcesses: []`.
6. **Boundary event agganciato al BORDO DEL SUBPROCESS stesso** (non a un task al suo interno): è un
   caso a parte, NON uno `attachedTo`/`attacher` (quel meccanismo collega due elementi dello stesso
   gruppo con un id locale, e un subprocess non ha un id locale in nessun gruppo - vedi sezione
   "Boundary event" sotto per il caso "normale" su un task). Riconoscerlo nel PDF: il cerchio
   dell'evento è posizionato esattamente a cavallo del bordo del rettangolo del subprocess (di solito
   in basso), non dentro né del tutto fuori. Per ognuno che vedi, aggiungi una entry nell'array
   `boundaryEvents` del subprocess (vedi formato sotto):
   - `names`: l'etichetta esatta del boundary event + sinonimi IT/EN, stessa convenzione di
     `GroupElement.names`;
   - `eventDefinition`: il tipo dell'icona (Message/Timer/Signal/Error/Conditional);
   - `interrupting`: **singolo** cerchio = `true`, **doppio** cerchio = `false`; se non distinguibile
     lascia `null`;
   - `description`: una frase ORIGINALE (mai una citazione del testo) che spiega cosa deve prevedere
     il sottoprocesso - è il messaggio di feedback che vedrà lo studente se manca o non corrisponde.
     Esempio corretto: "Il sottoprocesso deve prevedere una condizione temporale di fine giornata."
     Esempio SBAGLIATO (citazione): "Al termine di ogni giornata il sistema addebita il costo".
   Un subprocess può avere più di un boundary event: aggiungi una entry per ciascuno. Cosa succede
   DOPO che il boundary event scatta (il task/gateway a cui porta la sua freccia in uscita) va
   comunque modellato come una ProcessPart indipendente nel modo consueto, con `previousParts: []`
   (non collegabile all'indietro al subprocess, stessa convenzione delle relazioni cross-pool via
   messageTo/messageFrom - vedi regola 9 più sotto). Se il subprocess non ha nessun boundary event
   agganciato al suo bordo, lascia `boundaryEvents: []`.

## Boundary event (attachedTo / attacher)

Questa sezione vale SOLO per un boundary event agganciato al bordo di un TASK (o altro elemento
dentro un gruppo) - se invece è agganciato al bordo di un SUBPROCESS, usa il meccanismo a parte
descritto al punto 6 della sezione "Subprocess" sopra, non questo.

Un boundary event è il cerchio agganciato al BORDO di un task. Per ogni boundary event che vedi:
- sul boundary event stesso, imposta `"attachedTo": { "type": "Part", "name": "<elementId locale del task a cui è agganciato, DENTRO LO STESSO GRUPPO>" }` (stessa convenzione di `previousElements`: un id locale come `"Task_1"`, non il nome della parte);
- sul task che lo ospita, aggiungi quello stesso elementId locale del boundary event dentro il suo array `"attacher": [...]`.
Ricorda: perché questo funzioni, task e boundary event devono stare nello stesso gruppo della stessa ProcessPart (vedi regola 5 sopra). Se non ci sono boundary event nel diagramma, lascia `attachedTo: null` e `attacher: []` per tutti gli elementi.

## Formato del JSON

```json
{
  "processParts": [
    {
      "name": "<etichetta breve e sensata della sezione di flusso, es. 'Scelta proposta', NON una frase completa>",
      "possibleGroups": [
        {
          "groupId": "Group_1",
          "elements": [
            {
              "elementId": "<Tipo>_1",
              "parent": { "type": "Pool", "name": "<nome del pool a cui appartiene>" },
              "names": ["<etichetta esatta nel diagramma>", "<sinonimo 1>", "..."],
              "previousElements": [],
              "actor": "<nome della lane, o null>",
              "messageTo": [{ "type": "Part", "name": "<altra ProcessPart>" }],
              "messageFrom": [],
              "attachedTo": null,
              "attacher": [{ "type": "Part", "name": "<Tipo>_2" }],
              "elementVariants": [
                { "bpmnType": "<Task|UserTask|ServiceTask|SendTask|ReceiveTask|ManualTask|ScriptTask|BusinessRuleTask|ExclusiveGateway|ParallelGateway|InclusiveGateway|EventBasedGateway|StartEvent|EndEvent|IntermediateThrowEvent|IntermediateCatchEvent|BoundaryEvent>", "eventDefinition": "<null|Message|Timer|Signal|Error|Conditional|Terminate>", "interrupting": false, "gatewayType": null }
              ],
              "description": "<frase originale che riassume l'azione di QUESTO elemento - mai una citazione/parafrasi del testo dell'esercizio>"
            },
            {
              "elementId": "<Tipo>_2",
              "parent": { "type": "Pool", "name": "..." },
              "names": ["..."],
              "previousElements": ["<Tipo>_1"],
              "actor": "...",
              "messageTo": [], "messageFrom": [],
              "attachedTo": { "type": "Part", "name": "<Tipo>_1" },
              "attacher": [],
              "elementVariants": [{ "bpmnType": "...", "eventDefinition": null, "interrupting": false, "gatewayType": null }],
              "description": "..."
            }
          ]
        }
      ],
      "previousParts": ["<nome di un'altra ProcessPart che deve precedere questa, se esiste>"]
    }
  ],
  "businessEntities": [
    { "name": "<nome del pool>", "allowedNames": ["..."], "isCollapsed": false, "isOptional": false }
  ],
  "actors": [
    { "name": "<nome della lane>", "allowedNames": ["..."], "businessEntity": "<nome del pool a cui appartiene>" }
  ],
  "forbiddenEntities": [],
  "forbiddenActors": [],
  "subProcesses": [
    {
      "name": "<etichetta del rettangolo nel PDF>",
      "allowedNames": ["<etichetta esatta>", "<sinonimo 1>", "..."],
      "isEvent": false,
      "isInterrupting": null,
      "parent": { "type": "Pool", "name": "<pool che lo contiene>" },
      "boundaryEvents": [
        {
          "names": ["<etichetta esatta del boundary event>", "<sinonimo 1>", "..."],
          "eventDefinition": "Timer",
          "interrupting": true,
          "description": "<frase originale su cosa deve prevedere il sottoprocesso - mai una citazione del testo>"
        }
      ]
    }
  ]
}
```

Un elemento disegnato dentro il rettangolo di un subprocess usa `"parent": { "type": "SubProcess", "name": "<nome del subprocess>" }` invece di `{"type":"Pool", ...}` - per il resto (names/previousElements/actor/description/elementVariants/ecc.) segue esattamente le stesse regole di un elemento qualunque. Se non ci sono subprocess nel diagramma, lascia `"subProcesses": []` e non usare mai `"type": "SubProcess"` in nessun `parent`. Se un subprocess non ha boundary event agganciati al suo bordo, lascia `"boundaryEvents": []`.

Regole precise per riempire questa struttura:

1. **Un pool → un `businessEntity`**, **una lane → un `actor`** (con `businessEntity` che referenzia il nome del pool contenitore), **un rettangolo di subprocess → un `subProcess`** (con `parent` che referenzia il nome del pool contenitore - vedi sezione "Subprocess" sopra).
2. **Ogni ProcessPart raggruppa gli elementi che insieme realizzano UN passo del testo** (vedi sezione sopra) — non generare `elementVariants` alternative: l'array `elementVariants` di ogni elemento ha sempre e solo una voce, quella del tipo realmente disegnato.
3. **`ProcessPart.name` deve essere un'etichetta BREVE (2-4 parole) e sensata della sezione di flusso**, non una frase esplicativa completa. Esempio corretto: "Scelta proposta". Esempio SBAGLIATO (troppo lungo/discorsivo): "Lo studente sceglie la proposta di tirocinio da seguire". Pensa a come chiameresti quella fase in una legenda, non a come la descriveresti a qualcuno.
4. **`elementId`** = `"<bpmnType>_<posizione nel gruppo>"` (es. `"Task_1"`, `"ExclusiveGateway_2"`) — locale al gruppo, non serve essere univoco nell'intero diagramma. Questo stesso id è quello da usare in `previousElements`, `attachedTo` e `attacher`.
5. **`previousElements`**: id locali (dentro lo stesso gruppo) degli elementi che devono precedere questo, per l'ordinamento INTERNO alla ProcessPart. Vuoto per il primo elemento del gruppo.
6. **`names`**: il primo elemento dell'array deve essere l'etichetta ESATTA così come appare nel diagramma; seguono tutti i sinonimi italiano+inglese. Per gli elementi senza etichetta nel diagramma (gateway "anonimi"), lascia `names: []`.
7. **`description`** va valorizzato per OGNI elemento (con o senza etichetta) con una frase ORIGINALE che riassume cosa fa concretamente quell'elemento nel contesto del processo — è il messaggio di feedback che vedrà lo studente. **Non deve MAI essere una citazione o parafrasi diretta della frase del testo dell'esercizio da cui hai dedotto quella ProcessPart**: scrivi la descrizione dal punto di vista dell'elemento stesso (es. "Verifica che tutti i campi obbligatori della proposta siano compilati", non "Il sistema verifica la correttezza formale della proposta come richiesto al punto 2"). Deve essere specifica al dominio, non generica, ma nelle tue parole. Stessa regola per la `description` di un `boundaryEvents` di un subprocess (punto 6 della sezione "Subprocess").
8. **`actor`**: il nome della lane in cui è disegnato l'elemento; `null` se l'elemento appartiene solo al pool.
9. **`previousParts`**: la sequenza TRA le ProcessPart (non tra i singoli elementi che ormai sono raggruppati). Se una parte ha più predecessori diretti (dopo un gateway di join tra parti diverse), elencali tutti. **Vale SOLO tra ProcessPart che si trovano nello stesso contenitore**: stesso pool, e se annidate in un subprocess, lo stesso subprocess. Questo perché `previousParts` viene verificato cercando una vera sequence flow tra gli elementi, e una sequence flow non attraversa MAI il confine di un pool (né, salvo il subprocess stesso trattato come un unico nodo, il confine di un subprocess) - solo una message flow può farlo, e quella si modella con `messageTo`/`messageFrom`, non con `previousParts`. Quindi: se una ProcessPart è la PRIMA parte modellata in un pool (o in un subprocess) diverso da quello delle parti che la precedono cronologicamente nel processo, il suo `previousParts` resta **vuoto** anche se intuitivamente "viene dopo" qualcos'altro - quel collegamento, se esiste nel diagramma, è una message flow tra pool diversi e va espresso con `messageTo`/`messageFrom` sugli elementi specifici coinvolti, non con `previousParts` a livello di parte.
10. **Tipo e direzione dei gateway**: più uscite/una entrata → `gatewayType: "split"`; più entrate/una uscita → `gatewayType: "merge"`. Mai entrambe insieme: se il diagramma sembra mostrarlo, scegli il ruolo dominante e annota il compromesso in `description`.
11. **`eventDefinition`** (su `StartEvent`/`EndEvent`/`IntermediateThrowEvent`/`IntermediateCatchEvent`/`BoundaryEvent`): valori possibili `Message`/`Timer`/`Signal`/`Error`/`Conditional`/`Terminate`, dedotti dall'icona dentro il cerchio dell'evento (busta/orologio/triangolo/esclamativo/doppia-riga-in-diagonale/cerchio pieno nero). **`Terminate` è valido SOLO su un `EndEvent`** (nel PDF: un cerchio di fine con un cerchio pieno nero dentro, non un'icona) - non usarlo mai su `StartEvent`/intermediate/boundary, non ha senso in BPMN. `null` per un evento "bianco" senza icona (es. un semplice `EndEvent` di fine normale).
12. **`messageTo`/`messageFrom`/`attachedTo`/`attacher`**: segui le regole delle sezioni dedicate sopra. Il campo `"type"` di questi riferimenti vale sempre `"Part"` tranne quando `messageTo`/`messageFrom` punta esplicitamente a un pool esterno non modellato in dettaglio (allora `"Pool"`) - `attachedTo`/`attacher` sono SEMPRE `"Part"` con un elementId locale, mai `"Pool"`.
13. Non inventare pool, lane, elementi, subprocess o message/boundary flow che non sono visibili nel PDF: usa solo quello che vedi.

## Formato della risposta

Rispondi in due parti, in quest'ordine:

1. **Descrizione delle process part individuate**: un elenco puntato, una riga per ogni ProcessPart, con il suo nome breve e quali elementi del diagramma contiene e perché li hai raggruppati insieme (a quale passo del testo corrispondono). Questo serve a verificare rapidamente che la suddivisione abbia senso prima di usare il JSON. Questo è l'UNICO punto in cui puoi far riferimento al testo dell'esercizio - il JSON stesso (incluse le `description` dei singoli elementi) non deve mai citarlo direttamente.
2. **Il JSON completo, come FILE SCARICABILE** (usa la funzionalità di generazione file della piattaforma, es. Claude.ai code execution/artifact), non come blocco di testo da copiare a mano. Nominalo in modo descrittivo, es. `bpmn-<nome-esercizio>-reference.json`.
```

---

## Note d'uso

- Leggi sempre prima la descrizione delle parti: se il raggruppamento non ti convince, è più veloce correggere lì (rifare la richiesta con indicazioni più precise) che scoprirlo dopo aver importato il JSON.
- Il file JSON scaricato va caricato tramite il bottone **"Import reference"** nel Solution Creator dell'esercizio BPMN — apre il form già compilato con tutti i campi, pronto per preview/rifinitura manuale e salvataggio.
- Verifica sempre la preview generata confrontandola con il PDF originale prima di usare la soluzione per valutare studenti veri: la lettura del grafo (predecessori, tipo/direzione dei gateway, raggruppamento in parti, message/boundary flow, subprocess) è un'interpretazione, non una certezza assoluta. Il preview disegna message flow, boundary event davvero agganciati al loro host (task o subprocess), e subprocess con i loro elementi dentro - ma solo DENTRO ogni singola ProcessPart: le connessioni TRA parti diverse (incluse quelle tra un subprocess e il resto del pool) restano da disegnare a mano nel preview editabile, coerentemente con la regola sui `previousParts` (punto 9 sopra). I `boundaryEvents` dichiarati direttamente sul subprocess (punto 6 della sezione "Subprocess") sono verificati dall'evaluator e disegnati nel preview come eventi agganciati al bordo basso-destro del riquadro del subprocess (impilati in orizzontale se multipli) - se un subprocess non ha ancora elementi assegnati non ha un riquadro, quindi i suoi boundary event non vengono disegnati finché non gli assegni almeno un elemento.
- Le "varianti di elemento" (`elementVariants` multipli, per accettare più tipi BPMN equivalenti per lo stesso elemento), i `possibleGroups` alternativi multipli per una stessa ProcessPart, e `forbiddenEntities`/`forbiddenActors` sono intenzionalmente esclusi da questa generazione automatica: richiedono un giudizio pedagogico (quali errori tipici prevenire, quali alternative sono davvero equivalenti) che non è deducibile dal solo diagramma della soluzione ideale — vanno aggiunti a mano in un secondo momento tramite il form.
