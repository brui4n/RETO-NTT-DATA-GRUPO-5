from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from src.core.state import TicketState
from src.core.llm import get_llm

class SupportOutput(BaseModel):
    suggested_resolution: str = Field(
        description="Respuesta profesional, empática y accionable, recomendando unos pasos de solución o informando al usuario de la acción tomada."
    )

def support_node(state: TicketState) -> dict:
    """
    Genera respuestas sugeridas para los usuarios finales o instrucciones para el técnico.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres un Especialista de Soporte TI Nivel 2. "
         "Tu trabajo es leer un incidente clasificado y generar una respuesta amable, clara y accionable.\n"
         "Instrucciones:\n"
         "- Si es de red/VPN, sugiere verificar conexión a internet o reiniciar credenciales.\n"
         "- Si es hardware averiado, informa que un técnico irá al lugar pronto.\n"
         "- Si es contraseña/acceso, remite al portal de autoservicio (ej. password.empresa.local).\n"
         "- Sé directo pero empático."
        ),
        ("human", 
         "**Ticket crudo:** {description}\n"
         "**Categoría:** {category}\n"
         "**Tipo:** {ticket_type}\n"
         "**Prioridad asignada:** {priority}\n\n"
         "Redacta la respuesta sugerida:"
        )
    ])
    
    # Usamos algo de temperatura para que las respuestas suenen naturales y variadas
    llm = get_llm(temperature=0.3).with_structured_output(SupportOutput)
    chain = prompt | llm
    
    result: SupportOutput = chain.invoke({
        "description": state["description"],
        "category": state.get("category", "N/A"),
        "ticket_type": state.get("ticket_type", "N/A"),
        "priority": state.get("priority", "N/A")
    })
    
    return {
        "suggested_resolution": result.suggested_resolution
    }
