import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.tsx'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { ExpensesProvider } from './context/ExpensesContext'
import { ModalProvider } from './context/ModalContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <ExpensesProvider>
            <ModalProvider>
              <RouterProvider router={router} />
            </ModalProvider>
          </ExpensesProvider>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)