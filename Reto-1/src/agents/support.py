from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class SupportOutput(BaseModel):
    ai_response: str = Field(
        description="Respuesta profesional enviada al panel ITSM, engloba de forma educada una justificación de la categoría/prioridad asignada y una sugerencia de resolución."
    )

def support_node(state: TicketState) -> dict:
    """
    Genera respuestas sugeridas para los usuarios finales o instrucciones para el técnico.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres la Inteligencia Artificial del sistema ITSM. "
         "Tu trabajo es leer la clasificación y prioridad de un ticket y generar un 'AI Response' amigable y estructurado.\n"
         "Instrucciones:\n"
         "- Justifica brevemente por qué se dio esa prioridad/tipo basado en el reporte.\n"
         "- Sugiere de 1 a 3 pasos técnicos concretos de resolución para que el técnico lo copie o el usuario lo aplique.\n"
         "- Si es prioridad 'critical' o 'high', menciónalo explícitamente y usa emojis de alerta 🚨/🔴.\n"
         "- Sé directo, empático y profesional."
        ),
        ("human", 
         "**Título:** {title}\n"
         "**Ticket crudo:** {description}\n"
         "**Tipo:** {ticket_type}\n"
         "**Prioridad asignada:** {priority}\n\n"
         "Redacta el AI Response:"
        )
    ])
    
    llm = get_llm(temperature=0.3).with_structured_output(SupportOutput)
    chain = prompt | llm
    
    result: SupportOutput = chain.invoke({
        "title": state.get("title", ""),
        "description": state["description"],
        "ticket_type": state.get("ticket_type", "N/A"),
        "priority": state.get("priority", "N/A")
    })
    
    return {
        "ai_response": result.ai_response
    }
