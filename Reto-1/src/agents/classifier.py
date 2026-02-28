from pydantic import BaseModel, Field
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class ClassificationOutput(BaseModel):
    ticket_type: Literal["incident", "request", "problem"] = Field(
        description=(
            "Clasifica el ticket estrictamente en uno de estos tres tipos de ITSM:\n"
            "- 'incident': Interrupción no planificada de un servicio (ej. laptop no enciende).\n"
            "- 'request': Solicitud formal de un nuevo servicio o acceso (ej. instalar software).\n"
            "- 'problem': Causa raíz de incidentes recurrentes."
        )
    )

def classifier_node(state: TicketState) -> dict:
    """
    Analiza el texto del ticket y determina su tipo exacto para la base de datos SQL.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres un analista experto de ServiceNow de nivel 1. "
         "Tu objetivo es tipificar los reportes de los usuarios (incluso si están incompletos) "
         "para inyectarlos en la base relacional de ITSM."
        ),
        ("human", "Analiza el siguiente reporte del usuario titulado '{title}':\n\n{description}")
    ])
    
    llm = get_llm(temperature=0).with_structured_output(ClassificationOutput)
    chain = prompt | llm
    
    result: ClassificationOutput = chain.invoke({
        "title": state.get("title", ""),
        "description": state["description"]
    })
    
    return {
        "ticket_type": result.ticket_type
    }
