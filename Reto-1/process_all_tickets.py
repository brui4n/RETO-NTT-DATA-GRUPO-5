import sqlite3
import sys
import os
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from src.core.orchestrator import process_ticket

def process_all():
    """
    Procesa todos los tickets de la base de datos que tienen estado 'OPEN'.
    Es útil para llenar la base de datos con inferencias de la IA para la demo inicial.
    """
    conn = sqlite3.connect('data/tickets.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM tickets WHERE status = 'OPEN'")
    rows = cursor.fetchall()
    
    print(f"Iniciando el procesamiento de {len(rows)} tickets ficticios con la IA LangGraph...")
    
    for row in rows:
        ticket_data = dict(row)
        print(f"Procesando Ticket #{ticket_data['id']}: {ticket_data['description'][:50]}...")
        
        try:
            state = process_ticket(ticket_data)
            
            cursor.execute('''
                UPDATE tickets 
                SET category = ?, ticket_type = ?, priority = ?, priority_justification = ?, resolution_notes = ?, status = 'CLASIFICADO_IA'
                WHERE id = ?
            ''', (
                state.get("category"),
                state.get("ticket_type"),
                state.get("priority"), 
                state.get("priority_justification"),
                state.get("suggested_resolution"), 
                ticket_data['id']
            ))
            conn.commit()
            print(f" -> Éxito. Prioridad: {state.get('priority')} | Categoría: {state.get('category')}")
        except Exception as e:
            print(f" -> Error con el ticket #{ticket_data['id']}: {e}")
        
    conn.close()
    print("¡Procesamiento masivo completado! El dashboard de Streamlit ahora tiene datos hermosos.")

if __name__ == '__main__':
    process_all()
