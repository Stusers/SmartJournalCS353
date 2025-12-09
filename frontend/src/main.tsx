import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, DbAuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <DbAuthProvider>
        <App />
      </DbAuthProvider>
    </ClerkProvider>
  </StrictMode>,
)
