-- =====================================================
-- SISTEMA ITSM NTT DATA
-- BASE DE DATOS COMPLETA
-- =====================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS itsm_nttdata
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE itsm_nttdata;

-- =====================================================
-- TABLA: USERS
-- Almacena información de todos los usuarios del sistema
-- =====================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  puesto VARCHAR(100) NOT NULL COMMENT 'Cargo/puesto del usuario - CAMPO NUEVO REQUERIDO',
  area VARCHAR(100) NOT NULL COMMENT 'Departamento/área del usuario - CAMPO NUEVO REQUERIDO',
  role ENUM('user', 'staff', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY idx_email (email),
  KEY idx_role (role),
  KEY idx_area (area),
  KEY idx_puesto (puesto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Usuarios del sistema ITSM';

-- =====================================================
-- TABLA: TICKETS
-- Almacena todos los tickets del sistema
-- =====================================================
CREATE TABLE tickets (
  id VARCHAR(20) NOT NULL,
  user_id INT NOT NULL COMMENT 'ID del usuario creador',
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('incident', 'request', 'problem') NOT NULL,
  priority ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  status ENUM('open', 'in-progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to_id INT NULL COMMENT 'ID del personal asignado - CAMPO PARA ASIGNACIÓN',
  ai_response TEXT NULL COMMENT 'Respuesta generada por IA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_assigned_to_id (assigned_to_id),
  KEY idx_status (status),
  KEY idx_priority (priority),
  KEY idx_type (type),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to_id) 
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tickets del sistema ITSM';

-- =====================================================
-- TABLA: TICKET_HISTORY
-- Registro de todos los cambios en los tickets
-- =====================================================
CREATE TABLE ticket_history (
  id INT AUTO_INCREMENT,
  ticket_id VARCHAR(20) NOT NULL,
  action VARCHAR(500) NOT NULL,
  user_id INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_ticket_id (ticket_id),
  KEY idx_timestamp (timestamp),
  
  CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) 
    REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de cambios en tickets';

-- =====================================================
-- TRIGGER: Auto cambio de estado al asignar personal
-- Este trigger cambia automáticamente el estado a 'in-progress'
-- cuando se asigna personal a un ticket
-- =====================================================
DELIMITER $$

CREATE TRIGGER trg_auto_status_on_assign
BEFORE UPDATE ON tickets
FOR EACH ROW
BEGIN
  -- Si se asigna personal por primera vez, cambiar estado automáticamente
  IF NEW.assigned_to_id IS NOT NULL 
     AND OLD.assigned_to_id IS NULL 
     AND OLD.status = 'open' THEN
    SET NEW.status = 'in-progress';
    
    -- Opcional: Registrar en historial (requiere procedimiento adicional)
    -- INSERT INTO ticket_history (ticket_id, action, user_id)
    -- VALUES (NEW.id, CONCAT('Auto-asignado. Estado cambiado a IN-PROGRESS'), NEW.assigned_to_id);
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Tickets con información completa del creador y asignado
CREATE VIEW v_tickets_complete AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.type,
  t.priority,
  t.status,
  -- Datos del creador
  u_creator.id AS creator_id,
  u_creator.name AS creator_name,
  u_creator.email AS creator_email,
  u_creator.puesto AS creator_puesto,
  u_creator.area AS creator_area,
  -- Datos del asignado
  u_assigned.id AS assigned_id,
  u_assigned.name AS assigned_name,
  u_assigned.email AS assigned_email,
  u_assigned.puesto AS assigned_puesto,
  u_assigned.area AS assigned_area,
  -- Timestamps
  t.ai_response,
  t.created_at,
  t.updated_at
FROM tickets t
INNER JOIN users u_creator ON t.user_id = u_creator.id
LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id;

-- Vista: Estadísticas por área
CREATE VIEW v_stats_by_area AS
SELECT 
  u.area,
  COUNT(DISTINCT t.id) AS total_tickets,
  SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) AS tickets_abiertos,
  SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS tickets_en_proceso,
  SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) AS tickets_resueltos,
  SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) AS tickets_cerrados,
  SUM(CASE WHEN t.priority = 'critical' THEN 1 ELSE 0 END) AS tickets_criticos
FROM users u
LEFT JOIN tickets t ON u.id = t.user_id
GROUP BY u.area;

-- Vista: Carga de trabajo del staff
CREATE VIEW v_staff_workload AS
SELECT 
  u.id,
  u.name,
  u.puesto,
  u.area,
  COUNT(t.id) AS total_asignados,
  SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS en_proceso,
  SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) AS resueltos,
  SUM(CASE WHEN t.priority = 'critical' THEN 1 ELSE 0 END) AS criticos_asignados
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_to_id
WHERE u.role IN ('staff', 'admin')
GROUP BY u.id, u.name, u.puesto, u.area;

-- =====================================================
-- DATOS DE EJEMPLO / TESTING
-- =====================================================

-- Usuarios de ejemplo
INSERT INTO users (name, email, password, puesto, area, role) VALUES
('Admin Sistema', 'admin@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador de Sistemas', 'Tecnología', 'admin'),
('Juan Pérez', 'juan@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Soporte TI', 'Soporte', 'staff'),
('María González', 'maria@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Analista Senior', 'Finanzas', 'user'),
('Carlos Rodríguez', 'carlos@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Desarrollador', 'Tecnología', 'user'),
('Ana Martínez', 'ana@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Líder de Proyecto', 'Operaciones', 'staff'),
('Luis Torres', 'luis@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Analista Junior', 'Marketing', 'user'),
('Sofia Vargas', 'sofia@nttdata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gerente', 'Recursos Humanos', 'user');

-- Tickets de ejemplo
INSERT INTO tickets (id, user_id, title, description, type, priority, status, assigned_to_id, ai_response) VALUES
('INC-000001', 3, 'Sistema de correo caído en producción', 'El sistema de correo electrónico está completamente caído afectando a todos los usuarios de la empresa desde las 9:00 AM. Urgente necesitamos solución inmediata.', 'incident', 'critical', 'in-progress', 2, '🔴 Incidente crítico detectado. Escalado automáticamente a nivel 3. ETA: 2 horas.'),
('INC-000002', 4, 'Solicitud de acceso a base de datos', 'Necesito acceso de lectura a la base de datos de producción para generar reportes mensuales del departamento.', 'request', 'medium', 'open', NULL, '🟡 Solicitud en proceso. ETA: 2-3 días laborables.'),
('INC-000003', 6, 'Error en aplicación web', 'La aplicación web del portal de clientes muestra error 500 al intentar hacer login. Varios usuarios reportan el mismo problema.', 'incident', 'high', 'in-progress', 5, '🟠 Alta prioridad. Asignado a equipo especializado. ETA: 4 horas.'),
('INC-000004', 3, 'Instalación de software', 'Requiero instalación de Adobe Creative Suite en mi equipo para trabajos de diseño.', 'request', 'low', 'open', NULL, '🟢 Requerimiento en cola de procesamiento.'),
('INC-000005', 7, 'Problema recurrente con VPN', 'La conexión VPN se desconecta constantemente cada 15 minutos. Este es un problema que se repite todos los días.', 'problem', 'medium', 'resolved', 2, '🟡 Monitoreo activo de recurrencia.');

-- Historial de tickets
INSERT INTO ticket_history (ticket_id, action, user_id) VALUES
('INC-000001', 'Ticket creado', 3),
('INC-000001', 'Clasificado como INCIDENT - CRITICAL por IA', 1),
('INC-000001', 'Asignado a Juan Pérez', 1),
('INC-000001', 'Estado cambiado a IN-PROGRESS', 1),

('INC-000002', 'Ticket creado', 4),
('INC-000002', 'Clasificado como REQUEST - MEDIUM por IA', 1),

('INC-000003', 'Ticket creado', 6),
('INC-000003', 'Clasificado como INCIDENT - HIGH por IA', 1),
('INC-000003', 'Asignado a Ana Martínez', 1),
('INC-000003', 'Estado cambiado a IN-PROGRESS', 1),

('INC-000004', 'Ticket creado', 3),
('INC-000004', 'Clasificado como REQUEST - LOW por IA', 1),

('INC-000005', 'Ticket creado', 7),
('INC-000005', 'Clasificado como PROBLEM - MEDIUM por IA', 1),
('INC-000005', 'Asignado a Juan Pérez', 1),
('INC-000005', 'Estado cambiado a IN-PROGRESS', 1),
('INC-000005', 'Marcado como resuelto', 2);

-- =====================================================
-- CONSULTAS ÚTILES PARA TESTING
-- =====================================================

-- Ver todos los tickets con información completa
SELECT * FROM v_tickets_complete ORDER BY created_at DESC;

-- Ver estadísticas por área
SELECT * FROM v_stats_by_area ORDER BY total_tickets DESC;

-- Ver carga de trabajo del staff
SELECT * FROM v_staff_workload ORDER BY total_asignados DESC;

-- Ver historial de un ticket específico
SELECT 
  h.timestamp,
  h.action,
  u.name AS performed_by,
  u.puesto,
  u.area
FROM ticket_history h
INNER JOIN users u ON h.user_id = u.id
WHERE h.ticket_id = 'INC-000001'
ORDER BY h.timestamp ASC;

-- Ver tickets sin asignar
SELECT 
  id,
  title,
  priority,
  type,
  creator_name,
  creator_area,
  created_at
FROM v_tickets_complete
WHERE assigned_id IS NULL
ORDER BY priority DESC, created_at ASC;

-- Ver tickets críticos en progreso
SELECT 
  id,
  title,
  assigned_name,
  assigned_puesto,
  created_at,
  updated_at
FROM v_tickets_complete
WHERE priority = 'critical' AND status = 'in-progress';

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- Procedimiento para asignar personal automáticamente
DELIMITER $$

CREATE PROCEDURE sp_assign_ticket(
  IN p_ticket_id VARCHAR(20),
  IN p_staff_id INT,
  IN p_assigned_by INT
)
BEGIN
  DECLARE v_staff_name VARCHAR(100);
  
  -- Obtener nombre del staff
  SELECT name INTO v_staff_name FROM users WHERE id = p_staff_id;
  
  -- Actualizar ticket (el trigger cambiará el estado automáticamente)
  UPDATE tickets 
  SET assigned_to_id = p_staff_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_ticket_id;
  
  -- Agregar al historial
  INSERT INTO ticket_history (ticket_id, action, user_id)
  VALUES (p_ticket_id, CONCAT('Asignado a ', v_staff_name), p_assigned_by);
  
  -- Agregar cambio de estado al historial
  INSERT INTO ticket_history (ticket_id, action, user_id)
  VALUES (p_ticket_id, 'Estado cambiado a IN-PROGRESS', p_assigned_by);
END$$

DELIMITER ;

-- Procedimiento para resolver ticket
DELIMITER $$

CREATE PROCEDURE sp_resolve_ticket(
  IN p_ticket_id VARCHAR(20),
  IN p_resolved_by INT
)
BEGIN
  -- Actualizar estado
  UPDATE tickets 
  SET status = 'resolved',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_ticket_id;
  
  -- Agregar al historial
  INSERT INTO ticket_history (ticket_id, action, user_id)
  VALUES (p_ticket_id, 'Marcado como resuelto', p_resolved_by);
END$$

DELIMITER ;

-- =====================================================
-- EJEMPLO DE USO DE PROCEDIMIENTOS
-- =====================================================

-- Asignar ticket INC-000002 a Juan Pérez (ID 2), asignado por Admin (ID 1)
-- CALL sp_assign_ticket('INC-000002', 2, 1);

-- Resolver ticket INC-000003, resuelto por Ana Martínez (ID 5)
-- CALL sp_resolve_ticket('INC-000003', 5);

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX idx_status_priority ON tickets(status, priority);
CREATE INDEX idx_type_status ON tickets(type, status);

-- Índice para búsquedas por fecha
CREATE INDEX idx_created_date ON tickets(created_at DESC);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar creación
SELECT 'Base de datos ITSM NTT DATA creada exitosamente' AS mensaje;
SELECT COUNT(*) AS total_usuarios FROM users;
SELECT COUNT(*) AS total_tickets FROM tickets;
SELECT COUNT(*) AS total_historial FROM ticket_history;
