import { createRoot } from 'react-dom/client'
import { initializeSystemUsers } from './utils/userStorage'
import './styles/index.css'
import App from './App.jsx'

// Seed the required standard portfolios into local storage so they are available universally
initializeSystemUsers();

// NOTE: StrictMode intentionally removed — ProcessingScreen.useEffect uses
// hasStartedRef guard that is incompatible with StrictMode double-mount.
// DO NOT add StrictMode back.
createRoot(document.getElementById('root')).render(
  <App />,
)
