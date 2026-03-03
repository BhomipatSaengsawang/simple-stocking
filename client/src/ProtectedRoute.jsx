import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
    const token = localStorage.getItem('token');

    // ถ้าไม่มี Token → ไปหน้า Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // ถ้ามี Token → แสดงหน้าที่ต้องการ
    return <Outlet />;
}

export default ProtectedRoute;
