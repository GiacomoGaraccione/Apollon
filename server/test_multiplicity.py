#!/usr/bin/env python3
"""
Script di test per verificare il corretto funzionamento della funzione 
convert_apollon_model_to_reference, in particolare per il problema delle
molteplicità invertite.
"""

import sys
import os
import json

# Aggiungi il percorso del modulo al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.evaluator.utils import convert_apollon_model_to_reference
from app.evaluator.logger_config import clear_all_logs

def create_test_model():
    """
    Crea un modello di test con associazioni per verificare 
    che le molteplicità vengano assegnate correttamente.
    """
    return {
        "elements": {
            "class1": {
                "id": "class1",
                "name": "Customer",
                "type": "Class",
                "attributes": []
            },
            "class2": {
                "id": "class2", 
                "name": "Order",
                "type": "Class",
                "attributes": []
            },
            "class3": {
                "id": "class3",
                "name": "Product", 
                "type": "Class",
                "attributes": []
            }
        },
        "relationships": {
            "rel1": {
                "id": "rel1",
                "name": "places",
                "type": "ClassUnidirectional",
                "source": {
                    "element": "class1",
                    "multiplicity": "1",
                    "role": "customer"
                },
                "target": {
                    "element": "class2", 
                    "multiplicity": "0..*",
                    "role": "orders"
                }
            },
            "rel2": {
                "id": "rel2",
                "name": "contains",
                "type": "ClassBidirectional", 
                "source": {
                    "element": "class2",
                    "multiplicity": "1..*",
                    "role": "order"
                },
                "target": {
                    "element": "class3",
                    "multiplicity": "1..*", 
                    "role": "products"
                }
            }
        }
    }

def test_multiplicity_assignment():
    """
    Test per verificare che le molteplicità vengano assegnate correttamente.
    """
    print("=== TEST MOLTEPLICITÀ ===")
    
    # Pulisci i log precedenti
    clear_all_logs()
    
    test_model = create_test_model()
    
    print("Modello di test:")
    print(json.dumps(test_model, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Converti il modello
    reference = convert_apollon_model_to_reference(test_model)
    
    print("Risultato conversione:")
    print(f"Numero classi: {len(reference['classes'])}")
    print(f"Numero associazioni: {len(reference['associations'])}")
    
    # Verifica ogni associazione
    for i, assoc in enumerate(reference['associations']):
        print(f"\nAssociazione {i+1}: {assoc.get('name', 'unnamed')}")
        print(f"  ID: {assoc.get('elementId')}")
        print(f"  Tipo: {assoc.get('type')}")
        
        source = assoc.get('source', {})
        target = assoc.get('target', {})
        
        print(f"  Source:")
        print(f"    Role: '{source.get('role', '')}'")
        print(f"    Multiplicities: {source.get('multiplicities', [])}")
        if source.get('referenceClass'):
            print(f"    Class: {source['referenceClass'].get('name', 'unknown')}")
        
        print(f"  Target:")
        print(f"    Role: '{target.get('role', '')}'")
        print(f"    Multiplicities: {target.get('multiplicities', [])}")
        if target.get('referenceClass'):
            print(f"    Class: {target['referenceClass'].get('name', 'unknown')}")
    
    # Verifica specifica per l'associazione 1 (Customer -> Order)
    if reference['associations']:
        rel1 = reference['associations'][0]
        expected_source_mult = "1"
        expected_target_mult = "0..*"
        
        actual_source_mult = rel1['source']['multiplicities'][0] if rel1['source']['multiplicities'] else ""
        actual_target_mult = rel1['target']['multiplicities'][0] if rel1['target']['multiplicities'] else ""
        
        print(f"\n=== VERIFICA ASSOCIAZIONE 1 ===")
        print(f"Attesa source multiplicity: '{expected_source_mult}' -> Trovata: '{actual_source_mult}'")
        print(f"Attesa target multiplicity: '{expected_target_mult}' -> Trovata: '{actual_target_mult}'")
        
        if actual_source_mult == expected_source_mult and actual_target_mult == expected_target_mult:
            print("✅ MOLTEPLICITÀ CORRETTE!")
        else:
            print("❌ ERRORE NELLE MOLTEPLICITÀ!")
            return False
    
    return True

if __name__ == '__main__':
    success = test_multiplicity_assignment()
    
    print(f"\n{'='*50}")
    if success:
        print("✅ TEST COMPLETATO CON SUCCESSO")
    else:
        print("❌ TEST FALLITO")
    
    print("\nControlla i log in server/logs/ per dettagli aggiuntivi.")
    sys.exit(0 if success else 1)
