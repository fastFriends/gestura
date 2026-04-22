import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Home from './components/Home';
import Personal from './components/Personal';
import Translator from './components/Translator';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup';
import Sidebar from './components/Sidebar';
import Underworks from './components/Underworks';
import ProtectedRoute from './components/ProtectedRoute';

function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/underworks" element={<Underworks />} />
            <Route element={<AppLayout />}>
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/personal" element={<ProtectedRoute><Personal /></ProtectedRoute>} />
              <Route path="/translator" element={<ProtectedRoute><Translator /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}