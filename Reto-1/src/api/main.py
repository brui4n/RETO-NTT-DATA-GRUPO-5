from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.core.orchestrator import process_ticket

app = FastAPI(title="ITSM GenIA API")

# Habilitar CORS para que React (localhost:5173) pueda conectarse a FastAPI (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod debería ser ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect('data/tickets.db')
    conn.row_factory = sqlite3.Row
    return conn

# ==== SCHEMAS ====
class TicketCreate(BaseModel):
    user_id: int
    title: str
    description: str

class TicketUpdate(BaseModel):
    status: str = None
    assigned_to_id: int = None

# ==== RUTAS ====

@app.get("/api/users")
def get_users():
    conn = get_db()
    users = conn.execute("SELECT id, name, email, puesto, area, role FROM users").fetchall()
    conn.close()
    return [dict(u) for u in users]

@app.get("/api/users/staff")
def get_staff():
    conn = get_db()
    staff = conn.execute("SELECT id, name, email, puesto, area, role FROM users WHERE role IN ('staff', 'admin')").fetchall()
    conn.close()
    return [dict(s) for s in staff]

@app.get("/api/tickets")
def get_tickets():
    conn = get_db()
    # Query que emula la vista completa con nombre del usuario y asignado
    query = """
    SELECT 
        t.id, t.title, t.description, t.type, t.priority, t.status, 
        t.ai_response, t.created_at as createdAt, t.updated_at as updatedAt,
        u.name as user_name, u.email as user_email, u.area as user_area, u.puesto as user_puesto,
        a.name as assigned_name, a.email as assigned_email, a.puesto as assigned_puesto
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.assigned_to_id = a.id
    ORDER BY t.created_at DESC
    """
    tickets_rows = conn.execute(query).fetchall()
    
    # Formatear al JSON que espera el frontend
    tickets = []
    for row in tickets_rows:
        t = dict(row)
        formatted_ticket = {
            "id": t['id'],
            "title": t['title'],
            "description": t['description'],
            "type": t['type'],
            "priority": t['priority'],
            "status": t['status'],
            "aiResponse": t['ai_response'],
            "createdAt": t['createdAt'],
            "updatedAt": t['updatedAt'],
            "user": {
                "name": t['user_name'],
                "email": t['user_email'],
                "area": t['user_area'],
                "puesto": t['user_puesto']
            },
            "assignedTo": None if not t['assigned_name'] else {
                "name": t['assigned_name'],
                "email": t['assigned_email'],
                "puesto": t['assigned_puesto']
            },
            "history": [] # El historial lo traemos solo si piden ticket por ID por performance
        }
        tickets.append(formatted_ticket)
    
    conn.close()
    return tickets

@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    conn = get_db()
    query = """
    SELECT 
        t.id, t.title, t.description, t.type, t.priority, t.status, 
        t.ai_response, t.created_at as createdAt, t.updated_at as updatedAt,
        u.name as user_name, u.email as user_email, u.area as user_area, u.puesto as user_puesto,
        a.name as assigned_name, a.email as assigned_email, a.puesto as assigned_puesto
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.assigned_to_id = a.id
    WHERE t.id = ?
    """
    t_row = conn.execute(query, (ticket_id,)).fetchone()
    
    if not t_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    t = dict(t_row)
    
    # Obtener historial
    hist_rows = conn.execute("""
        SELECT h.timestamp, h.action, u.name as user 
        FROM ticket_history h 
        JOIN users u ON h.user_id = u.id 
        WHERE h.ticket_id = ? 
        ORDER BY h.timestamp ASC
    """, (ticket_id,)).fetchall()
    
    formatted_ticket = {
        "id": t['id'],
        "title": t['title'],
        "description": t['description'],
        "type": t['type'],
        "priority": t['priority'],
        "status": t['status'],
        "aiResponse": t['ai_response'],
        "createdAt": t['createdAt'],
        "updatedAt": t['updatedAt'],
        "user": {
            "name": t['user_name'],
            "email": t['user_email'],
            "area": t['user_area'],
            "puesto": t['user_puesto']
        },
        "assignedTo": None if not t['assigned_name'] else {
            "name": t['assigned_name'],
            "email": t['assigned_email'],
            "puesto": t['assigned_puesto']
        },
        "history": [{"timestamp": h['timestamp'], "action": h['action'], "user": h['user']} for h in hist_rows]
    }
    
    conn.close()
    return formatted_ticket

@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Generar nuevo ID
    cursor.execute("SELECT COUNT(*) as count FROM tickets")
    count = cursor.fetchone()['count'] + 1
    new_id = f"INC-{str(count).zfill(6)}"
    
    # 2. Insertar Base
    cursor.execute(
        "INSERT INTO tickets (id, user_id, title, description, type, priority, status) VALUES (?, ?, ?, ?, 'incident', 'low', 'open')",
        (new_id, ticket.user_id, ticket.title, ticket.description)
    )
    cursor.execute(
        "INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, 'Ticket reportado vía Portal', ?)",
        (new_id, ticket.user_id)
    )
    conn.commit()
    
    # 3. Procesar IA (LangGraph)
    ticket_data = {"id": new_id, "user_id": ticket.user_id, "title": ticket.title, "description": ticket.description}
    try:
        state = process_ticket(ticket_data)
        
        # 4. Actualizar estado
        cursor.execute('''
            UPDATE tickets 
            SET type = ?, priority = ?, ai_response = ?, status = 'in-progress', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            state.get("ticket_type"),
            state.get("priority"), 
            state.get("ai_response"), 
            new_id
        ))
        
        # 5. Historial de IA
        action_desc = f"IA Clasifica Automáticamente: {str(state.get('ticket_type')).upper()} - {str(state.get('priority')).upper()}."
        cursor.execute("INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, ?, ?)", (new_id, action_desc, 1)) # 1 = Sistema IA
        conn.commit()
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error procesando IA: {str(e)}")
        
    conn.close()
    
    # Retornar el ticket recién creado llamando al endpoint by_id
    return get_ticket(new_id)

@app.put("/api/tickets/{ticket_id}")
def update_ticket(ticket_id: str, updates: TicketUpdate):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check exists
    t = cursor.execute("SELECT id FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    admin_id = 1 # Emulamos la acción hecha por admin
    
    if updates.status:
        cursor.execute("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (updates.status, ticket_id))
        cursor.execute("INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, ?, ?)", 
                      (ticket_id, f"Estado cambiado a {updates.status}", admin_id))
                      
    if updates.assigned_to_id:
        cursor.execute("UPDATE tickets SET assigned_to_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (updates.assigned_to_id, ticket_id))
        # Asumimos que el trigger de BD cambiará su status a in-progress también o ya se maneja manual
        user = cursor.execute("SELECT name FROM users WHERE id = ?", (updates.assigned_to_id,)).fetchone()
        name = user['name'] if user else 'Personal'
        cursor.execute("INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, ?, ?)", 
                      (ticket_id, f"Asignado a {name}", admin_id))
                      
    conn.commit()
    conn.close()
    
    return get_ticket(ticket_id)
