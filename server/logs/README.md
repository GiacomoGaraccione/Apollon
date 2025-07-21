# Configurazione del sistema di logging per Apollon Evaluator

## Struttura dei file di log

I log dell'evaluator vengono salvati nella directory `server/logs/` con la seguente struttura:

- `evaluator_YYYYMMDD.log` - Log principale dell'evaluator per il giorno corrente
- Log rotati automaticamente quando raggiungono 10MB
- Mantiene fino a 5 file di backup

## Livelli di logging

- **ERROR**: Errori e eccezioni
- **INFO**: Informazioni generali e debug delle associazioni
- **DEBUG**: Informazioni dettagliate per il debugging (se abilitato)

## Formato dei log

```
YYYY-MM-DD HH:MM:SS,mmm - logger_name - LEVEL - function_name:line_number - message
```

## Configurazione personalizzata

Per modificare la configurazione del logging, edita il file `logger_config.py`:

- Cambia il livello di logging (DEBUG, INFO, WARNING, ERROR)
- Modifica la dimensione massima dei file di log
- Cambia il numero di file di backup da mantenere
- Personalizza il formato dei messaggi

## Esempi di utilizzo

```python
from app.evaluator.logger_config import get_eval_logger

logger = get_eval_logger()

# Log di informazione
logger.info("Elaborazione modello completata")

# Log di errore
logger.error("Errore durante l'elaborazione: %s", str(error))

# Log con dati strutturati
logger.info("Associazione elaborata: %s", {"source": source, "target": target})
```

## Monitoraggio dei log

Per monitorare i log in tempo reale su Windows:

```bash
# Visualizza gli ultimi log
tail -f server/logs/evaluator_YYYYMMDD.log

# Cerca errori specifici
grep "ERROR" server/logs/evaluator_*.log
```
