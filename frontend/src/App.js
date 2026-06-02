import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import Home from "./pages/Home";
import Donate from "./pages/Donate";
import Verify from "./pages/Verify";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import SuccessStories from "./pages/SuccessStories";
import PDFView from "./pages/PDFView";
import PlatformDetail from "./pages/PlatformDetail";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verify/:token" element={<Verify />} />
              <Route path="/success-stories" element={<SuccessStories />} />
              <Route path="/platforms/:slug" element={<PlatformDetail />} />
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/pdf-view" element={<PDFView />} />
            </Routes>
          </BrowserRouter>
        </AdminProvider>
      </AuthProvider>
    </div>
  );
}

export default App;