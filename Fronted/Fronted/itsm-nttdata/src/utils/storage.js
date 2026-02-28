/**
 * Storage module for ITSM tickets and users
 * Uses REST API from FastAPI Backend
 */

const API_URL = 'http://localhost:8000/api'

// ==================== TICKETS ====================

export async function getTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`)
    if (!res.ok) throw new Error('Error fetching tickets')
    return await res.json()
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function addTicket(ticketPayload) {
  // ticketPayload must have: user_id, title, description
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketPayload),
  })
  if (!res.ok) throw new Error('Error creating ticket')
  return await res.json()
}

export async function updateTicket(ticketId, updates) {
  // updates can have: status, assigned_to_id
  const payload = {}
  if (updates.status) payload.status = updates.status
  if (updates.assignedTo) payload.assigned_to_id = 1 // Simplified: Assigned to Admin always for demo 
  // O podemos usar updates.assignedTo.id si lo pasamos desde la UI

  const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Error updating ticket')
  return await res.json()
}

export async function getTicketById(ticketId) {
  const res = await fetch(`${API_URL}/tickets/${ticketId}`)
  if (!res.ok) throw new Error('Error fetching ticket')
  return await res.json()
}

// ==================== USERS (staff) ====================

export async function getStaffUsers() {
  try {
    const res = await fetch(`${API_URL}/users/staff`)
    if (!res.ok) throw new Error('Error fetching staff')
    return await res.json()
  } catch (err) {
    console.error(err)
    return []
  }
}

