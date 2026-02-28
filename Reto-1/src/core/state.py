from typing import TypedDict, Optional, List
from langchain_core.messages import BaseMessage

class TicketState(TypedDict):
    """
    Representa el estado del ticket a medida que fluye por la máquina de estados de LangGraph.
    """
    ticket_id: str # Ej: INC-000001
    user_id: int
    title: str
    description: str
    
    # Datos enriquecidos por el Agente Clasificador
    ticket_type: Optional[str] # incident, request, problem
    
    # Datos enriquecidos por el Agente de Priorización
    priority: Optional[str] # low, medium, high, critical
    
    # Datos enriquecidos por el Agente de Soporte (Englobando justificación y ayuda)
    ai_response: Optional[str]
    
    # Historial de mensajes 
    messages: List[BaseMessage]
