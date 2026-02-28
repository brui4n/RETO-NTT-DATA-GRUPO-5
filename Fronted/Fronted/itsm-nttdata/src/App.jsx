import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header/Header'
import CreateTicketPage from './pages/CreateTicketPage/CreateTicketPage'
import AdminPage from './pages/AdminPage/AdminPage'

export default function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<CreateTicketPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
