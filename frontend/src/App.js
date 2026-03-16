import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import Home from "./pages/Home";
import Donate from "./pages/Donate";
import Verify from "./pages/Verify";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import SuccessStories from "./pages/SuccessStories";
import PDFView from "./pages/PDFView";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

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
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
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