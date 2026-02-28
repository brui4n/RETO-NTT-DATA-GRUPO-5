from pydantic import BaseModel, Field
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class PrioritizationOutput(BaseModel):
    priority: Literal["low", "medium", "high", "critical"] = Field(
        description="Prioridad del caso basada en impacto y urgencia (EN INGLÉS ESTRICTO: low, medium, high, critical)."
    )

def prioritizer_node(state: TicketState) -> dict:
    """
    Evalúa impacto, urgencia y contexto para asignar prioridad en inglés.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres un coordinador de Service Desk. Tu misión es evaluar la prioridad de un ticket "
         "basado en su nivel de urgencia (el tiempo es crítico) y su impacto (cuántas personas o qué procesos clave afecta). "
         "Retorna UNICAMENTE ('low', 'medium', 'high', 'critical')"
        ),
        ("human", 
         "**Título:** {title}\n"
         "**Descripción:** {description}\n"
         "**Tipo:** {ticket_type}\n\n"
         "Determina la prioridad oficial."
        )
    ])
    
    llm = get_llm(temperature=0).with_structured_output(PrioritizationOutput)
    chain = prompt | llm
    
    result: PrioritizationOutput = chain.invoke({
        "title": state.get("title", ""),
        "description": state["description"],
        "ticket_type": state.get("ticket_type", "N/A")
    })
    
    return {
        "priority": result.priority
    }
