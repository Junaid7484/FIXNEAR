import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function RoleProtectedRoute({ allowedRoles }) {

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // No login
    if (!token || !userData) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    // User does not have required role
    if (!allowedRoles.includes(user.role)) {

        if (user.role === "customer") {
            return <Navigate to="/" replace />;
        }

        if (user.role === "provider") {
            return (
                <Navigate
                    to="/provider/dashboard"
                    replace
                />
            );
        }

        if (user.role === "admin") {
            return (
                <Navigate
                    to="/admin/dashboard"
                    replace
                />
            );
        }

        return <Navigate to="/login" replace />;
    }

    // Correct role
    return <Outlet />;
}

export default RoleProtectedRoute;