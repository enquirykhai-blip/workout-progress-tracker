import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initRipple } from './utils/motion'
import { registerSW } from 'virtual:pwa-register'

initRipple()

// Service worker: when a new version is deployed, tell the app so it can show
// an "Update" bar. Also look for a new version whenever the app comes back to
// the foreground and every 30 minutes — home-screen apps (iPad/iPhone) can
// otherwise keep running an old cached version for a long time.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.__applyUpdate = () => updateSW(true)
    window.dispatchEvent(new Event('app:update-available'))
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => registration.update().catch(() => {})
    setInterval(check, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
