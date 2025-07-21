import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

def setup_logger(name, log_file=None, level=logging.INFO, overwrite=True):
    """
    Configura un logger per i moduli dell'evaluator.
    
    Args:
        name (str): Nome del logger
        log_file (str, optional): Nome del file di log. Se None, usa un nome di default.
        level (int): Livello di logging (default: INFO)
        overwrite (bool): Se True, sovrascrive il file di log esistente. Se False, aggiunge ai log esistenti.
    
    Returns:
        logging.Logger: Logger configurato
    """
    
    # Crea la directory dei log se non esiste
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Se non viene specificato un file di log, usa un nome di default con timestamp
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = f"evaluator_{timestamp}.log"
    
    log_path = os.path.join(log_dir, log_file)
    
    # Crea il logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Evita di aggiungere handler duplicati
    if not logger.handlers:
        # Se overwrite è True, prova a eliminare il file esistente
        if overwrite and os.path.exists(log_path):
            try:
                os.remove(log_path)
            except (PermissionError, OSError):
                # Se il file è in uso, usa un nome diverso con timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_name = log_file.replace('.log', '')
                log_file = f"{base_name}_{timestamp}.log"
                log_path = os.path.join(log_dir, log_file)
        
        # Handler per file con rotazione (max 10MB, mantiene 5 file di backup)
        file_handler = RotatingFileHandler(
            log_path, 
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8',
            mode='w' if overwrite else 'a'  # 'w' per sovrascrivere, 'a' per aggiungere
        )
        file_handler.setLevel(level)
        
        # Handler per console (opzionale, per mantenere output su console)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(level)
        
        # Formato del log
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Aggiungi gli handler al logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger

def get_evaluator_logger(overwrite=True):
    """
    Restituisce il logger principale per il modulo evaluator.
    
    Args:
        overwrite (bool): Se True, sovrascrive il file di log esistente
    """
    return setup_logger('evaluator', overwrite=overwrite)

def get_utils_logger(overwrite=True):
    """
    Restituisce il logger specifico per utils.py.
    
    Args:
        overwrite (bool): Se True, sovrascrive il file di log esistente
    """
    return setup_logger('evaluator.utils', overwrite=overwrite)

def get_eval_logger(overwrite=True):
    """
    Restituisce il logger specifico per eval.py.
    
    Args:
        overwrite (bool): Se True, sovrascrive il file di log esistente
    """
    return setup_logger('evaluator.eval', overwrite=overwrite)

def clear_all_logs():
    """
    Elimina tutti i file di log nella directory logs.
    """
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'logs')
    if os.path.exists(log_dir):
        for filename in os.listdir(log_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(log_dir, filename)
                try:
                    os.remove(file_path)
                    print(f"Eliminato file di log: {filename}")
                except OSError as e:
                    print(f"Errore nell'eliminazione di {filename}: {e}")

def clear_logs_older_than_days(days=7):
    """
    Elimina i file di log più vecchi di un numero specificato di giorni.
    
    Args:
        days (int): Numero di giorni. I file più vecchi verranno eliminati.
    """
    import time
    
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'logs')
    if os.path.exists(log_dir):
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        
        for filename in os.listdir(log_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(log_dir, filename)
                try:
                    if os.path.getmtime(file_path) < cutoff_time:
                        os.remove(file_path)
                        print(f"Eliminato file di log vecchio: {filename}")
                except OSError as e:
                    print(f"Errore nell'eliminazione di {filename}: {e}")

def get_log_files_info():
    """
    Restituisce informazioni sui file di log esistenti.
    """
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'logs')
    files_info = []
    
    if os.path.exists(log_dir):
        for filename in os.listdir(log_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(log_dir, filename)
                try:
                    stat = os.stat(file_path)
                    size_mb = stat.st_size / (1024 * 1024)
                    modified_time = datetime.fromtimestamp(stat.st_mtime)
                    files_info.append({
                        'filename': filename,
                        'size_mb': round(size_mb, 2),
                        'modified': modified_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'path': file_path
                    })
                except OSError:
                    continue
    
    return files_info
