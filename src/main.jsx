import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeSystemUsers } from './utils/userStorage'
import './styles/index.css'
import App from './App.jsx'

// Seed the required standard portfolios into local storage so they are available universally
initializeSystemUsers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
