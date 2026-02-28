import sqlite3
import sys
import os
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from src.core.orchestrator import process_ticket

def process_all():
    """
    Procesa todos los tickets de la base de datos que tienen estado 'open'.
    """
    conn = sqlite3.connect('data/tickets.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM tickets WHERE status = 'open' AND ai_response IS NULL")
    rows = cursor.fetchall()
    
    if not rows:
        print("No hay tickets pendientes de procesar.")
        conn.close()
        return
        
    print(f"Iniciando el procesamiento de {len(rows)} tickets ficticios con la IA LangGraph...")
    
    system_user_id = 1 # Admin reservado para operaciones del sistema
    
    for row in rows:
        ticket_data = dict(row)
        print(f"Procesando Ticket #{ticket_data['id']}: {ticket_data['title'][:40]}...")
        
        try:
            start_time = time.time()
            state = process_ticket(ticket_data)
            processing_time = time.time() - start_time
            
            # Actualizar Ticket Principal
            cursor.execute('''
                UPDATE tickets 
                SET type = ?, priority = ?, ai_response = ?, status = 'in-progress', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                state.get("ticket_type"),
                state.get("priority"), 
                state.get("ai_response"), 
                ticket_data['id']
            ))
            
            # Escribir en Historial
            action_desc = f"IA Clasifica: {state.get('ticket_type').upper()} - {state.get('priority').upper()}."
            cursor.execute('''
                INSERT INTO ticket_history (ticket_id, action, user_id)
                VALUES (?, ?, ?)
            ''', (ticket_data['id'], action_desc, system_user_id))
            
            conn.commit()
            print(f" -> Éxito ({processing_time:.1f}s). Prioridad: {state.get('priority')} | Tipo: {state.get('ticket_type')}")
        except Exception as e:
            print(f" -> Error con el ticket #{ticket_data['id']}: {e}")
        
    conn.close()
    print("¡Procesamiento masivo completado! El dashboard de Streamlit ahora leerá SQL nativo.")

if __name__ == '__main__':
    process_all()
