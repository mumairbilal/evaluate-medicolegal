import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { RoleProvider } from './context/RoleContext'
import AuthRoleBridge from './context/AuthRoleBridge'
import { ToastProvider } from './context/ToastContext'
import { PrototypeDataProvider } from './context/PrototypeDataContext'
import { NotificationProvider } from './context/NotificationContext'
import { ProfilePhotoProvider } from './context/ProfilePhotoContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <PrototypeDataProvider>
        <NotificationProvider>
        <RoleProvider>
          <ProfilePhotoProvider>
            <AuthRoleBridge>
              <App />
            </AuthRoleBridge>
          </ProfilePhotoProvider>
        </RoleProvider>
        </NotificationProvider>
        </PrototypeDataProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
