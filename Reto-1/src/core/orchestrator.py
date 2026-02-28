from langgraph.graph import StateGraph, END
from src.core.state import TicketState
from src.agents.classifier import classifier_node
from src.agents.prioritizer import prioritizer_node
from src.agents.support import support_node

def build_graph():
    """
    Construye la máquina de estados que orquesta a los agentes para el flujo del ticket.
    """
    graph = StateGraph(TicketState)
    
    # Añadir nodos (nuestros agentes)
    graph.add_node("clasificador", classifier_node)
    graph.add_node("priorizador", prioritizer_node)
    graph.add_node("soporte", support_node)
    
    # Definir el flujo (edges) secuencial
    graph.set_entry_point("clasificador")
    graph.add_edge("clasificador", "priorizador")
    graph.add_edge("priorizador", "soporte")
    graph.add_edge("soporte", END)
    
    # Compilar el grafo en una aplicación ejecutable
    app = graph.compile()
    return app

def process_ticket(ticket_data: dict) -> dict:
    """
    Toma un diccionario con los datos base de un ticket y lo pasa por la IA.
    Retorna el estado final enriquecido.
    """
    app = build_graph()
    
    initial_state = {
        "ticket_id": ticket_data.get("id"),
        "user_id": ticket_data.get("user_id", 0),
        "title": ticket_data.get("title", ""),
        "description": ticket_data.get("description", ""),
        "messages": []
    }
    
    # Invocamos la máquina de estados de forma síncrona
    final_state = app.invoke(initial_state)
    return final_state
