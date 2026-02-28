from typing import TypedDict, Optional, List
from langchain_core.messages import BaseMessage

class TicketState(TypedDict):
    """
    Representa el estado del ticket a medida que fluye por la máquina de estados de LangGraph.
    """
    ticket_id: Optional[int]
    user_id: str
    description: str
    
    # Datos enriquecidos por el Agente Clasificador
    category: Optional[str]
    ticket_type: Optional[str] # Incidente, Requerimiento, Problema
    
    # Datos enriquecidos por el Agente de Priorización
    priority: Optional[str] # Baja, Media, Alta, Crítica
    priority_justification: Optional[str]
    
    # Datos enriquecidos por el Agente de Soporte
    suggested_resolution: Optional[str]
    
    # Historial de mensajes (útil si hay ambigüedad y necesitamos pedir más info)
    messages: List[BaseMessage]
