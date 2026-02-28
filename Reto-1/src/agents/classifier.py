from pydantic import BaseModel, Field
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class ClassificationOutput(BaseModel):
    ticket_type: Literal["Incidente", "Requerimiento", "Problema", "Duda/Consulta"] = Field(
        description=(
            "Clasifica el ticket según las mejores prácticas ITSM:\n"
            "- Incidente: Interrupción no planificada de un servicio de TI o reducción de su calidad (ej. laptop no enciende, error en sistema).\n"
            "- Requerimiento: Solicitud formal de un nuevo servicio o acceso (ej. instalar software, acceso a carpeta).\n"
            "- Problema: Causa raíz de uno o más incidentes (generalmente no lo reporta un usuario común).\n"
            "- Duda/Consulta: Pregunta general."
        )
    )
    category: Literal["Hardware", "Software Corporativo", "Redes / VPN", "Accesos / Cuentas", "Correo Electrónico", "Otro"] = Field(
        description="Categoría principal del asunto reportado."
    )

def classifier_node(state: TicketState) -> dict:
    """
    Analiza el texto del ticket y determina su tipo y categoría.
    Retorna un diccionario con las claves a actualizar en el estado.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres un analista experto de ServiceNow/Jira Service Management de nivel 1. "
         "Tu objetivo es interpretar los reportes de los usuarios (incluso si están incompletos, mal redactados o ambiguos) "
         "y transformarlos en información estructurada ITSM."
        ),
        ("human", "Analiza el siguiente reporte del usuario:\n\n{description}")
    ])
    
    llm = get_llm(temperature=0).with_structured_output(ClassificationOutput)
    chain = prompt | llm
    
    result: ClassificationOutput = chain.invoke({"description": state["description"]})
    
    return {
        "ticket_type": result.ticket_type,
        "category": result.category
    }
