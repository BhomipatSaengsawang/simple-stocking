import React, { useState }                              from "react";
import { BrowserRouter, Routes, Route, Navigate }       from "react-router-dom";
import { jwtDecode }                                    from "jwt-decode"; // npm install jwt-decode

// Pages
import PageTest                                         from "./pages/PageTest";
import NoPageFound                                      from "./pages/NoPageFound";
import Inventory                                        from "./pages/Inventory";
import ProductCreate                                    from "./pages/ProductCreate";
import Salepage                                         from "./pages/Salepage";

// Components
import Sidebar                                          from "./components/Sidebar/Sidebar";
import Dashboard                                        from "./components/Dashboard/Dashboard";
import OrderList                                        from "./components/OrderList/OrderList";
import LoginPage                                        from "./components/Login/Login";
import RegisterPage                                     from "./components/Register/Register";

// ===== Protected Route Component =====
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    // 1. ไม่มี Token
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. เช็ค Token หมดอายุ
    try {
        const decoded   = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
            localStorage.removeItem("token");
            return <Navigate to="/login" replace />;
        }
    } catch (err) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    return children;
};

// ===== Layout สำหรับหน้าที่มี Sidebar =====
const MainLayout = ({ children, isCollapsed, setIsCollapsed }) => {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            <main
                style={{
                    flex           : 1,
                    marginLeft     : isCollapsed ? "80px" : "260px",
                    padding        : "40px",
                    transition     : "margin-left 0.3s ease",
                    backgroundColor: "#f9fafb",
                }}
            >
                {children}
            </main>
        </div>
    );
};

// ===== App =====
const App = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <BrowserRouter>
            <Routes>

                {/* ===== Public Routes (ไม่มี Sidebar, ไม่ต้อง Login) ===== */}
                <Route path="/login"    element={<LoginPage />}    />
                <Route path="/register" element={<RegisterPage />} />

                {/* ===== Protected Routes (มี Sidebar, ต้อง Login) ===== */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout
                                isCollapsed={isCollapsed}
                                setIsCollapsed={setIsCollapsed}
                            >
                                <h1>ยินดีต้อนรับสู่ระบบ Bhomi POS</h1>
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <Inventory />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/create"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <ProductCreate />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/products/:id"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <ProductCreate />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sale"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <Salepage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <Dashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/order"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <OrderList />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/test"
                    element={
                        <ProtectedRoute>
                            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                                <PageTest />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* ===== Default ===== */}
                <Route path="*" element={<NoPageFound />} />

            </Routes>
        </BrowserRouter>
    );
};

export default App;
