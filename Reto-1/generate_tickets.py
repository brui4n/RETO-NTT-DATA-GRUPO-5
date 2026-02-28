import sqlite3
import random
from datetime import datetime, timedelta

def create_db():
    conn = sqlite3.connect('data/tickets.db')
    cursor = conn.cursor()
    
    # Limpiamos todo
    cursor.execute('DROP TABLE IF EXISTS ticket_history')
    cursor.execute('DROP TABLE IF EXISTS tickets')
    cursor.execute('DROP TABLE IF EXISTS users')
    
    # 1. TABLA: USERS
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        puesto TEXT NOT NULL,
        area TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user', -- 'user', 'staff', 'admin'
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 2. TABLA: TICKETS
    cursor.execute('''
    CREATE TABLE tickets (
        id TEXT PRIMARY KEY, -- ej: INC-000001
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL, -- 'incident', 'request', 'problem'
        priority TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
        status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in-progress', 'resolved', 'closed'
        assigned_to_id INTEGER,
        ai_response TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to_id) REFERENCES users(id)
    )
    ''')
    
    # 3. TABLA: TICKET_HISTORY
    cursor.execute('''
    CREATE TABLE ticket_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    
    # ==== INSERTAR DATOS OFICIALES ====
    users_data = [
        ('Admin Sistema', 'admin@nttdata.com', 'pwd_hash', 'Administrador de Sistemas', 'Tecnología', 'admin'),
        ('Juan Pérez', 'juan@nttdata.com', 'pwd_hash', 'Soporte TI', 'Soporte', 'staff'),
        ('María González', 'maria@nttdata.com', 'pwd_hash', 'Analista Senior', 'Finanzas', 'user'),
        ('Carlos Rodríguez', 'carlos@nttdata.com', 'pwd_hash', 'Desarrollador', 'Tecnología', 'user'),
        ('Ana Martínez', 'ana@nttdata.com', 'pwd_hash', 'Líder de Proyecto', 'Operaciones', 'staff'),
        ('Luis Torres', 'luis@nttdata.com', 'pwd_hash', 'Analista Junior', 'Marketing', 'user'),
        ('Sofia Vargas', 'sofia@nttdata.com', 'pwd_hash', 'Gerente', 'Recursos Humanos', 'user')
    ]
    cursor.executemany('''
        INSERT INTO users (name, email, password, puesto, area, role)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', users_data)
    
    # Obtener IDs de usuarios tipo "user" para generar tickets falsos
    cursor.execute("SELECT id FROM users WHERE role = 'user'")
    normal_users = [row[0] for row in cursor.fetchall()]

    dummy_reports = [
        ("No funciona la VPN", "Desde la actualización de Windows ayer, mi laptop no conecta a la VPN. Tengo reunión de gerencia en 15 min."),
        ("Correo caído", "Hola, no me da el correo, ayuda es urgente mi jefe me matará, necesito enviar un excel ya mismo."),
        ("Acceso a Finanzas", "Solicito acceso a la carpeta compartida de Finanzas \\\\server\\finanzas_2024"),
        ("Impresora dañada", "La impresora del piso 3 hace un ruido raro y mancha las hojas de toner."),
        ("Contraseña SAP", "He olvidado mi contraseña de SAP y se bloqueó mi cuenta tras 3 intentos."),
        ("Sistema Facturación lento", "El sistema de facturación web está cargando súper lento desde esta mañana y me saca error 50x a veces."),
        ("Pantallazo Azul", "Pantallazo azul en mi equipo de escritorio, dice un error de KERNEL_DATA_INPAGE_ERROR."),
        ("Instalar Photoshop", "Necesito instalar Photoshop en mi equipo nuevo para el área de Mkt."),
        ("Monitor parpadea", "Mi monitor secundario parpadea cuando abro aplicaciones pesadas."),
        ("Enlace Teams Roto", "El enlace de Teams de la sala de juntas no funciona, dice que la sala está ocupada pero no hay nadie."),
        ("Outlook límites", "No puedo adjuntar archivos de más de 10MB en el Outlook cliente nuevo."),
        ("Robo equipo móvil", "Me robaron el celular corporativo en el transporte, por favor bloqueen el acceso."),
        ("Teclado dañado", "El teclado de mi laptop tiene la tecla 'E' atascada."),
        ("Instalar IDE Python", "Necesito que me instalen Python y Visual Studio Code para un proyecto nuevo de datos."),
        ("Permisos Jira", "Mi cuenta de Jira no me permite crear épicas, dice que no tengo permisos en el proyecto B2B."),
        ("Falla en cable red", "No recibe internet mi equipo si lo conecto por cable, por WiFi sí funciona."),
        ("Acrobat colapsa", "Cada vez que intento imprimir PDF doble cara la aplicación Adobe Acrobat colapsa."),
        ("Mouse Ergonómico", "Necesito un mouse ergonómico por recomendaciones de salud ocupacional."),
        ("Servidor de desarrollo", "El servidor de desarrollo parece estar caído, intento un ping y no responde."),
        ("Posible Pishing", "He recibido un correo muy extraño pidiéndome cambiar mi clave de inmediato con un link acortado, creo que es pishing.")
    ]
    
    tickets_data = []
    history_data = []
    now = datetime.now()
    
    for i in range(20):
        # Fechas simuladas de los últimos 3 días
        random_days = random.uniform(0, 3)
        created_time = now - timedelta(days=random_days)
        str_time = created_time.strftime("%Y-%m-%d %H:%M:%S")
        
        ticket_id = f"INC-{str(i+1).zfill(6)}"
        user_id = random.choice(normal_users)
        title, description = dummy_reports[i]
        
        # Insertamos como 'open'. Aún no tienen tipo ni prioridad definida (esto lo hará la IA)
        tickets_data.append((ticket_id, user_id, title, description, 'incident', 'low', 'open', str_time, str_time))
        
        # Historial de creación
        history_data.append((ticket_id, "Ticket reportado y creado por el usuario en el Portal.", user_id, str_time))
    
    cursor.executemany('''
        INSERT INTO tickets (id, user_id, title, description, type, priority, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', tickets_data)
    
    cursor.executemany('''
        INSERT INTO ticket_history (ticket_id, action, user_id, timestamp)
        VALUES (?, ?, ?, ?)
    ''', history_data)
    
    conn.commit()
    conn.close()
    
    print(f"Base de datos migrada al standard de NTT Data. {len(tickets_data)} tickets encolados para su análisis.")

if __name__ == '__main__':
    create_db()
