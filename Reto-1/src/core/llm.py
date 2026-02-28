import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

def get_llm(temperature: float = 0.0):
    """
    Inicializa y devuelve el modelo de lenguaje configurado a través de Groq.
    Usamos llama-3.1-8b-instant porque es increíblemente rápido y gratuito.
    """
    return ChatGroq(model="llama-3.1-8b-instant", temperature=temperature)
