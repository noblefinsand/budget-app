import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.tsx'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { ExpensesProvider } from './context/ExpensesContext'
import { ModalProvider } from './context/ModalContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <ExpensesProvider>
          <ModalProvider>
            <RouterProvider router={router} />
          </ModalProvider>
        </ExpensesProvider>
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>,
)