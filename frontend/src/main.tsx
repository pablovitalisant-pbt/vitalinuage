import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { buildInfo } from './buildInfo'

if (typeof window !== 'undefined') {
    ;(window as any).__APP_COMMIT__ = buildInfo.commitSha
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
