import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Setup } from './pages/Setup'
import { Chat } from './pages/Chat'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { VerifyEmail } from './pages/VerifyEmail'
import { AuthCallback } from './pages/AuthCallback'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './components/AuthProvider'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Auth required but email verification not required */}
            <Route element={<ProtectedRoute requireEmailConfirmation={false} />}>
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Auth + Email confirmation required */}
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<Setup />} />
              <Route path="/chat" element={<Chat />} />
            </Route>

            {/* Auth + Google required */}
            <Route element={<ProtectedRoute requireGoogle /> }>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App