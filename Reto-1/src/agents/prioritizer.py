from pydantic import BaseModel, Field
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class PrioritizationOutput(BaseModel):
    priority: Literal["Baja", "Media", "Alta", "Crítica"] = Field(
        description="Prioridad del caso basada en impacto y urgencia."
    )
    priority_justification: str = Field(
        description="Justificación detallada y profesional (1-2 frases cortas) explicando por qué se asignó esta prioridad. Explica la decisión como un gerente ITSM."
    )

def prioritizer_node(state: TicketState) -> dict:
    """
    Evalúa impacto, urgencia y contexto para asignar prioridad.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres un coordinador de Service Desk. Tu misión es evaluar la prioridad de un ticket "
         "basado en su nivel de urgencia (el tiempo es crítico) y su impacto (cuántas personas o qué procesos clave afecta). "
         "Considera palabras que sugieran pánico, reuniones inminentes, gerencias involucradas o caídas totales de servicio para subir la prioridad."
        ),
        ("human", 
         "**Reporte Crudo:** {description}\n\n"
         "**Categoría asignada previamente:** {category}\n"
         "**Tipo:** {ticket_type}\n\n"
         "Determina la prioridad y justicia tu decisión."
        )
    ])
    
    llm = get_llm(temperature=0).with_structured_output(PrioritizationOutput)
    chain = prompt | llm
    
    result: PrioritizationOutput = chain.invoke({
        "description": state["description"],
        "category": state.get("category", "N/A"),
        "ticket_type": state.get("ticket_type", "N/A")
    })
    
    return {
        "priority": result.priority,
        "priority_justification": result.priority_justification
    }
