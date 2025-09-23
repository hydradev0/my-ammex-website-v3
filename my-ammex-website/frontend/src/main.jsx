import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { DataRefreshProvider } from './contexts/DataRefreshContext'
import { NotificationProvider } from './contexts/NotificationContext'

// Ensure React is available globally
window.React = React

createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <NotificationProvider>
          <DataRefreshProvider>
            <App />
          </DataRefreshProvider>
        </NotificationProvider>
      </AuthProvider>
    </StrictMode>
)
