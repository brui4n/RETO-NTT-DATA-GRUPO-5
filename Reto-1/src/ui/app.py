import streamlit as st
import sqlite3
import pandas as pd
import sys
import os

# Asegurar que se puede importar 'src' desde el root del proyecto
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.core.orchestrator import process_ticket

st.set_page_config(page_title="AI ITSM Assistant", layout="wide", page_icon="🤖")

def get_db_connection():
    conn = sqlite3.connect('data/tickets.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_users_by_role(role):
    conn = get_db_connection()
    users = conn.execute("SELECT id, name FROM users WHERE role = ?", (role,)).fetchall()
    conn.close()
    return [(u['id'], u['name']) for u in users]

st.title("🤖 Asistente Inteligente ITSM (NTT Data)")
st.caption("Prototipo demostrativo utilizando el Esquema Relacional Oficial. Asistido por Llama 3 (Groq API).")

tab1, tab2, tab3 = st.tabs(["👤 Portal Usuario", "🛠️ Dashboard Técnico ITSM", "📊 Analítica de IA"])

# --- TAB 1: PORTAL USUARIO ---
with tab1:
    st.header("Reportar un Incidente o Requerimiento")
    st.info("Describe tu problema con la mayor cantidad de detalles posible. Nuestra IA lo entenderá, clasificará y priorizará automáticamente simulando el trabajo de una mesa de ayuda Nivel 1.")
    
    with st.form("new_ticket_form"):
        users_list = get_users_by_role('user')
        selected_user = st.selectbox("Usuario que reporta:", options=users_list, format_func=lambda x: x[1])
        ticket_title = st.text_input("Asunto / Título (Breve):")
        description = st.text_area("Descripción del problema (puedes redactar de forma natural):", height=150)
        submitted = st.form_submit_button("Enviar Reporte")
        
        if submitted and description and ticket_title:
            with st.spinner("La GenIA de Groq está analizando, clasificando y priorizando tu ticket..."):
                conn = get_db_connection()
                cursor = conn.cursor()
                
                # Generar ID falso estilo INC-XXXXXX
                cursor.execute("SELECT COUNT(*) as count FROM tickets")
                count = cursor.fetchone()['count'] + 1
                new_id = f"INC-{str(count).zfill(6)}"
                user_id = selected_user[0]
                
                # 1. Insertar ticket inicial
                cursor.execute(
                    "INSERT INTO tickets (id, user_id, title, description, type, priority, status) VALUES (?, ?, ?, ?, 'incident', 'low', 'open')",
                    (new_id, user_id, ticket_title, description)
                )
                
                # 2. Insertar historial
                cursor.execute(
                    "INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, 'Ticket reportado vía Portal', ?)",
                    (new_id, user_id)
                )
                conn.commit()
                
                # 3. Procesar IA (LangGraph)
                ticket_data = {"id": new_id, "user_id": user_id, "title": ticket_title, "description": description}
                try:
                    state = process_ticket(ticket_data)
                    
                    # 4. Actualizar con IA
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
                    cursor.execute("INSERT INTO ticket_history (ticket_id, action, user_id) VALUES (?, ?, ?)", (new_id, action_desc, 1))
                    conn.commit()
                    
                    st.success(f"✅ Ticket {new_id} enviado y clasificado en milisegundos por la IA.")
                    st.write("**🤖 Respuesta Rápida de la IA para ti:**")
                    st.info(state.get("ai_response"))
                    
                except Exception as e:
                    st.error(f"Error procesando con IA: {e}")
                finally:
                    conn.close()

# --- TAB 2: DASHBOARD TÉCNICO ---
with tab2:
    st.header("Cola de Incidentes (Inbox)")
    
    col1, col2 = st.columns([8, 2])
    with col1:
        st.write("Vista Relacional (JOINs) en tiempo real de los tickets priorizados.")
    with col2:
        if st.button("🔄 Actualizar Tabla", use_container_width=True):
            pass
        
    conn = get_db_connection()
    # Consulta JOIN emulando v_tickets_complete del schema oficial
    query = """
    SELECT 
        t.id, t.title as Asunto, t.type as Tipo, t.priority as Prioridad, 
        t.status as Estado, u.name as Solicitante, u.area as Área, t.created_at as Fecha
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    """
    df = pd.read_sql_query(query, conn)
    
    if not df.empty:
        # Colorear prioridades
        def color_priority(val):
            color = 'black'
            if val == 'critical': color = 'red'
            elif val == 'high': color = 'orange'
            elif val == 'medium': color = 'blue'
            return f'color: {color}; font-weight: bold'
            
        st.dataframe(df.style.applymap(color_priority, subset=['Prioridad']), use_container_width=True, hide_index=True)
        
        st.divider()
        st.subheader("🕵️‍♂️ Inspeccionar Ticket (Explainable AI)")
        
        selected_ticket_id = st.selectbox("Selecciona un ID:", df['id'].tolist())
        
        if selected_ticket_id:
            ticket = conn.execute("SELECT * FROM tickets WHERE id = ?", (selected_ticket_id,)).fetchone()
            history = conn.execute("SELECT h.timestamp, h.action, u.name FROM ticket_history h JOIN users u ON h.user_id = u.id WHERE h.ticket_id = ? ORDER BY h.timestamp ASC", (selected_ticket_id,)).fetchall()
            
            st.write(f"### Detalles del Ticket `{ticket['id']}` - {ticket['title']}")
            st.error(f"📜 **Descripción Cruda del Usuario:**\n> {ticket['description']}")
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.info(f"🏷️ **Agente Clasificador:**\n\n- **Tipo Inferido:** `{str(ticket['type']).upper()}`\n*(incident, request o problem)*")
            with col_b:
                st.warning(f"🚨 **Agente Priorizador:**\n\n- **Ponderación:** `{str(ticket['priority']).upper()}`\n*(low, medium, high, critical)*")
            
            with st.expander("🤖 Ver AI Response (Soporte)", expanded=True):
                st.success(ticket['ai_response'] if pd.notna(ticket['ai_response']) else "No procesado por IA.")
                
            with st.expander("⏳ Historial Log del Ticket", expanded=False):
                for h in history:
                    st.write(f"**[{h['timestamp']}] {h['name']}:** {h['action']}")

# --- TAB 3: ANALÍTICA ---
with tab3:
    st.header("Métricas Generadas (Agente Analítico)")
    st.write("El agente procesa todos los incidentes categorizados para detectar patrones.")
    
    if not df.empty:
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Tickets por Prioridad")
            priority_counts = df['Prioridad'].value_counts()
            st.bar_chart(priority_counts, color="#ff4b4b")
            
        with col2:
            st.subheader("Tickets por Tipo (Clasificación AI)")
            type_counts = df['Tipo'].value_counts()
            st.bar_chart(type_counts, color="#1e88e5")
            
        st.subheader("Detectando Incidentes Recurrentes")
        top_type = type_counts.idxmax() if not type_counts.empty else "N/A"
        st.info(
            f"🤖 **Insight:**\n\n"
            f"He detectado que la mayor volumetría de tickets está en la clasificación **'{str(top_type).upper()}'**. "
            f"Para este rubro sugiero implementar un flujo de Auto-Servicio en el Service Desk para reducir la carga de analistas manuales."
        )
    conn.close()
