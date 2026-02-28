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

st.title("🤖 Asistente Inteligente ITSM (Reto 1)")
st.caption("Prototipo demostrativo utilizando datos 100% ficticios. Asistido por Inteligencia Artificial (LangGraph + OpenAI).")

tab1, tab2, tab3 = st.tabs(["👤 Portal Usuario", "🛠️ Dashboard Técnico ITSM", "📊 Analítica de IA"])

# --- TAB 1: PORTAL USUARIO ---
with tab1:
    st.header("Reportar un Incidente o Requerimiento")
    st.info("Describe tu problema con la mayor cantidad de detalles posible. Nuestra IA lo entenderá, clasificará y priorizará automáticamente.")
    
    with st.form("new_ticket_form"):
        user_id = st.text_input("Tu Usuario de Red (ej. USR-1234)", value="USR-9999")
        description = st.text_area("Descripción del problema (puedes redactar de forma natural):", height=150)
        submitted = st.form_submit_button("Enviar Reporte")
        
        if submitted and description:
            with st.spinner("La GenIA está analizando, clasificando y priorizando tu ticket..."):
                conn = get_db_connection()
                cursor = conn.cursor()
                
                # Insertar ticket inicial
                cursor.execute(
                    "INSERT INTO tickets (timestamp, user_id, description, status) VALUES (datetime('now', 'localtime'), ?, ?, 'NUEVO')",
                    (user_id, description)
                )
                conn.commit()
                new_id = cursor.lastrowid
                
                # Procesar con la Máquina de Estados (LangGraph)
                ticket_data = {"id": new_id, "user_id": user_id, "description": description}
                try:
                    state = process_ticket(ticket_data)
                    
                    # Actualizar ticket en BD con resultados
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
                        new_id
                    ))
                    conn.commit()
                    
                    st.success("✅ Ticket enviado y procesado exitosamente por la IA.")
                    
                    st.write("**🤖 Respuesta Rápida de la IA para ti:**")
                    st.info(state.get("suggested_resolution"))
                    
                except Exception as e:
                    st.error(f"Error procesando con IA: {e}")
                    # A veces OpenAI falla si no hay API key
                    st.warning("Asegúrate de tener configurada tu OPENAI_API_KEY en el archivo .env")
                finally:
                    conn.close()

# --- TAB 2: DASHBOARD TÉCNICO ---
with tab2:
    st.header("Cola de Incidentes (Inbox)")
    
    col1, col2 = st.columns([8, 2])
    with col1:
        st.write("Visualización en tiempo real de los tickets priorizados automáticamente por la IA.")
    with col2:
        if st.button("🔄 Actualizar Tabla", use_container_width=True):
            pass
        
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM tickets ORDER BY id DESC", conn)
    conn.close()
    
    if not df.empty:
        # Mostramos una tabla resumida
        display_df = df[['id', 'timestamp', 'user_id', 'ticket_type', 'category', 'priority', 'status', 'description']]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
        
        st.divider()
        st.subheader("🕵️‍♂️ Verificar Decisión de la IA (Explainability)")
        
        selected_ticket_id = st.selectbox("Selecciona el ID de un ticket para inspeccionar el razonamiento de los Agentes:", df['id'].tolist())
        
        if selected_ticket_id:
            ticket = df[df['id'] == selected_ticket_id].iloc[0]
            
            st.write(f"### Ticket #{ticket['id']} reportado por `{ticket['user_id']}`")
            st.error(f"📜 **Descripción Cruda:**\n> {ticket['description']}")
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.info(f"🏷️ **Agente Clasificador determinó:**\n\n- **Tipo:** {ticket['ticket_type']}\n- **Categoría:** {category}")
            with col_b:
                st.warning(f"🚨 **Agente Priorizador determinó:**\n\n- **Prioridad:** {ticket['priority']}\n- **Por qué:** {ticket['priority_justification']}")
            
            with st.expander("🛠️ Ver Respuesta Sugerida (Agente de Soporte)", expanded=True):
                st.success(ticket['resolution_notes'] if pd.notna(ticket['resolution_notes']) else "No procesado por IA aún.")

# --- TAB 3: ANALÍTICA ---
with tab3:
    st.header("Métricas Generadas (Agente Analítico)")
    st.write("El agente analítico procesa todos los incidentes categorizados por la IA para detectar patrones y prevenir problemas futuros.")
    
    if not df.empty and df['priority'].notna().any():
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Tickets por Prioridad")
            priority_counts = df['priority'].value_counts()
            st.bar_chart(priority_counts, color="#ff4b4b")
            
        with col2:
            st.subheader("Tickets por Categoría")
            category_counts = df['category'].value_counts()
            st.bar_chart(category_counts, color="#1e88e5")
            
        st.subheader("Detectando Incidentes Recurrentes")
        # Simulación de un insight analítico
        top_category = category_counts.idxmax() if not category_counts.empty else "N/A"
        st.info(
            f"🤖 **Insight del Agente Analítico:**\n\n"
            f"He detectado que la mayor volumetría de tickets está en la categoría **'{top_category}'**. "
            f"Sugiero crear un artículo en la Base de Conocimiento para resoluciones de Nivel 0 o automatizar este acceso "
            f"para reducir la carga operativa del Service Desk."
        )
    else:
        st.write("No hay datos analíticos suficientes o no se han procesado tickets con la IA.")
