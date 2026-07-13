import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import { resetTokenVault } from '@/lib/resetTokenVault'

async function bootstrap() {
  // Capture and remove password-reset credentials before App/Auth modules are
  // evaluated, so logging, monitoring and network clients never see the token.
  resetTokenVault.captureFromBrowser()
  const { installGlobalErrorMonitoring } = await import('@/lib/observability')
  installGlobalErrorMonitoring()
  const { default: App } = await import('@/App.jsx')

  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
}

bootstrap()
