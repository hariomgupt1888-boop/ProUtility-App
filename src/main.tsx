import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // 👈 YEH LINE SABSE ZAROORI HAI!
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)