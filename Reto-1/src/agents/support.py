from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.core.state import TicketState
from src.core.llm import get_llm

def support_node(state: TicketState) -> dict:
    """
    Genera respuestas sugeridas para los usuarios finales o instrucciones para el técnico.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "Eres la Inteligencia Artificial del sistema ITSM. "
         "Tu trabajo es leer la clasificación y prioridad de un ticket y generar un 'AI Response' amigable y MUY BIEN estructurado.\n"
         "Instrucciones:\n"
         "- Justifica brevemente por qué se dio esa prioridad/tipo basado en el reporte.\n"
         "- Sugiere de 1 a 3 pasos técnicos concretos de resolución. ES OBLIGATORIO usar formato Markdown con dobles saltos de línea reales entre párrafos y listas numeradas o viñetas para no amontonar el texto.\n"
         "- Si es prioridad 'critical' o 'high', menciónalo explícitamente y usa emojis de alerta 🚨/🔴.\n"
         "- Sé directo, empático y profesional."
        ),
        ("human", 
         "**Título:** {title}\n"
         "**Ticket crudo:** {description}\n"
         "**Tipo:** {ticket_type}\n"
         "**Prioridad asignada:** {priority}\n\n"
         "Redacta tu respuesta en Markdown bien espaciado:"
        )
    ])
    
    # En lugar de with_structured_output generamos texto crudo (Markdown) directamente
    llm = get_llm(temperature=0.3)
    chain = prompt | llm | StrOutputParser()
    
    result = chain.invoke({
        "title": state.get("title", ""),
        "description": state["description"],
        "ticket_type": state.get("ticket_type", "N/A"),
        "priority": state.get("priority", "N/A")
    })
    
    return {
        "ai_response": result
    }
