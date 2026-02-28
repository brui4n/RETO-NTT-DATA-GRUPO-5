import sqlite3
import json
import random
from datetime import datetime, timedelta

def create_db():
    conn = sqlite3.connect('data/tickets.db')
    cursor = conn.cursor()
    
    # Creamos la tabla con las columnas adicionales requeridas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        user_id TEXT,
        description TEXT,
        status TEXT DEFAULT 'OPEN',
        category TEXT,
        ticket_type TEXT,
        priority TEXT,
        priority_justification TEXT,
        resolution_notes TEXT
    )
    ''')
    
    # Datos ficticios muy reales (sin PII)
    dummy_descriptions = [
        "Desde la actualización de Windows ayer, mi laptop no conecta a la VPN. Tengo reunión de gerencia en 15 min.",
        "Hola, no me da el correo, ayuda es urgente mi jefe me matará, necesito enviar un excel ya mismo.",
        "Solicito acceso a la carpeta compartida de Finanzas \\\\server\\finanzas_2024",
        "La impresora del piso 3 hace un ruido raro y mancha las hojas de toner.",
        "He olvidado mi contraseña de SAP y se bloqueó mi cuenta tras 3 intentos.",
        "El sistema de facturación web está cargando súper lento desde esta mañana y me saca error 50x a veces.",
        "Pantallazo azul en mi equipo de escritorio, dice un error de KERNEL_DATA_INPAGE_ERROR.",
        "Necesito instalar Photoshop en mi equipo nuevo para el área de Mkt.",
        "Mi monitor secundario parpadea cuando abro aplicaciones pesadas.",
        "El enlace de Teams de la sala de juntas no funciona, dice que la sala está ocupada pero no hay nadie.",
        "No puedo adjuntar archivos de más de 10MB en el Outlook cliente nuevo.",
        "Me robaron el celular corporativo en el transporte, por favor bloqueen el acceso.",
        "El teclado de mi laptop tiene la tecla 'E' atascada.",
        "Necesito que me instalen Python y Visual Studio Code para un proyecto nuevo de datos.",
        "Mi cuenta de Jira no me permite crear épicas, dice que no tengo permisos en el proyecto B2B.",
        "No recibe internet mi equipo si lo conecto por cable, por WiFi sí funciona.",
        "Cada vez que intento imprimir PDF doble cara la aplicación Adobe Acrobat colapsa.",
        "Necesito un mouse ergonómico por recomendaciones de salud ocupacional.",
        "El servidor de desarrollo parece estar caído, intento un ping y no responde.",
        "He recibido un correo muy extraño pidiéndome cambiar mi clave de inmediato con un link acortado, creo que es pishing."
    ]
    
    tickets_data = []
    now = datetime.now()
    
    for i in range(20):
        # Fechas simuladas de los últimos 3 días
        random_days = random.uniform(0, 3)
        timestamp = (now - timedelta(days=random_days)).strftime("%Y-%m-%d %H:%M:%S")
        
        user_id = f"USR-{random.randint(1000, 9999)}"
        description = dummy_descriptions[i]
        
        tickets_data.append((timestamp, user_id, description))
    
    cursor.execute('DROP TABLE IF EXISTS tickets')
    
    cursor.execute('''
    CREATE TABLE tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        user_id TEXT,
        description TEXT,
        status TEXT DEFAULT 'OPEN',
        category TEXT,
        ticket_type TEXT,
        priority TEXT,
        priority_justification TEXT,
        resolution_notes TEXT
    )
    ''')
    
    cursor.executemany('''
        INSERT INTO tickets (timestamp, user_id, description)
        VALUES (?, ?, ?)
    ''', tickets_data)
    
    conn.commit()
    conn.close()
    
    print(f"Base de datos 'data/tickets.db' re-generada exitosamente con soporte para todos los campos GenIA.")

if __name__ == '__main__':
    create_db()
