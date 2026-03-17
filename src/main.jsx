import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initAdBlocker } from '@/lib/adBlocker'

// Initialize ad blocker to protect against malware
initAdBlocker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)