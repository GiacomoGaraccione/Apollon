#!/usr/bin/env python3
"""
Script di utilità per gestire i file di log dell'evaluator Apollon.
"""

import os
import sys
import argparse
from datetime import datetime

# Aggiungi il percorso del modulo al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.evaluator.logger_config import clear_all_logs, clear_logs_older_than_days, get_log_files_info

def main():
    parser = argparse.ArgumentParser(description='Gestione file di log Apollon Evaluator')
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--clear-all', action='store_true', 
                      help='Elimina tutti i file di log')
    group.add_argument('--clear-old', type=int, metavar='DAYS',
                      help='Elimina i file di log più vecchi di N giorni')
    group.add_argument('--info', action='store_true',
                      help='Mostra informazioni sui file di log esistenti')
    group.add_argument('--tail', type=str, metavar='FILENAME',
                      help='Mostra le ultime righe del file di log specificato')
    
    args = parser.parse_args()
    
    if args.clear_all:
        print("Eliminazione di tutti i file di log...")
        clear_all_logs()
        print("Operazione completata.")
        
    elif args.clear_old:
        print(f"Eliminazione dei file di log più vecchi di {args.clear_old} giorni...")
        clear_logs_older_than_days(args.clear_old)
        print("Operazione completata.")
        
    elif args.info:
        print("Informazioni sui file di log:")
        print("-" * 60)
        files_info = get_log_files_info()
        if files_info:
            for info in files_info:
                print(f"File: {info['filename']}")
                print(f"  Dimensione: {info['size_mb']} MB")
                print(f"  Ultima modifica: {info['modified']}")
                print(f"  Percorso: {info['path']}")
                print()
        else:
            print("Nessun file di log trovato.")
            
    elif args.tail:
        log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
        log_file = os.path.join(log_dir, args.tail)
        
        if not os.path.exists(log_file):
            print(f"File di log non trovato: {args.tail}")
            sys.exit(1)
            
        print(f"Ultime righe di {args.tail}:")
        print("-" * 60)
        
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Mostra le ultime 20 righe
                for line in lines[-20:]:
                    print(line.rstrip())
        except Exception as e:
            print(f"Errore nella lettura del file: {e}")

if __name__ == '__main__':
    main()
