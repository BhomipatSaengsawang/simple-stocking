import React, { useState }                        from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode }                              from "jwt-decode";

// Pages
import PageTest       from "./pages/PageTest";
import NoPageFound    from "./pages/NoPageFound";
import Inventory      from "./pages/Inventory";
import ProductCreate  from "./pages/ProductCreate";
import Salepage       from "./pages/Salepage";

// Components
import Sidebar        from "./components/Sidebar/Sidebar";
import Dashboard      from "./components/Dashboard/Dashboard";
import OrderList      from "./components/OrderList/OrderList";
import TodaySum       from "./components/TodaySum/TodaySum";
import LoginPage      from "./components/Login/Login";
import RegisterPage   from "./components/Register/Register";
import MouthSum       from "./components/MouthSum/MouthSum";

import styles from "./App.module.css";

// ===== Protected Route =====
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            return <Navigate to="/login" replace />;
        }
    } catch {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }
    return children;
};

// ===== Layout =====
// fullHeight: true  → no padding, content fills remaining space (Sale page)
// fullHeight: false → normal padded content area (all other pages)
const MainLayout = ({ children, isCollapsed, setIsCollapsed, fullHeight = false }) => (
    <div className={styles.appShell}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`${styles.mainContent} ${fullHeight ? styles.mainContentFull : ''} ${isCollapsed ? styles.mainCollapsed : ''}`}>
            {children}
        </main>
    </div>
);

// Helper to reduce repetition
const P = ({ children, isCollapsed, setIsCollapsed, full }) => (
    <ProtectedRoute>
        <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} fullHeight={full}>
            {children}
        </MainLayout>
    </ProtectedRoute>
);

// ===== App =====
const App = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const lp = { isCollapsed, setIsCollapsed };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login"    element={<LoginPage />}    />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected */}
                <Route path="/"                       element={<P {...lp}><div className={styles.welcomePage}><h1>ยินดีต้อนรับสู่ระบบ Bhomi POS</h1></div></P>} />
                <Route path="/inventory"              element={<P {...lp}><Inventory /></P>} />
                <Route path="/inventory/create"       element={<P {...lp}><ProductCreate /></P>} />
                <Route path="/inventory/products/:id" element={<P {...lp}><ProductCreate /></P>} />
                <Route path="/sale"                   element={<P {...lp} full><Salepage /></P>} />
                <Route path="/dashboard"              element={<P {...lp}><Dashboard /></P>} />
                <Route path="/dashboard/order"        element={<P {...lp}><OrderList /></P>} />
                <Route path="/dashboard/today"        element={<P {...lp}><TodaySum /></P>} />
                <Route path="/dashboard/month"        element={<P {...lp}><MouthSum /></P>} />
                <Route path="/test"                   element={<P {...lp}><PageTest /></P>} />

                {/* 404 */}
                <Route path="*" element={<NoPageFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;