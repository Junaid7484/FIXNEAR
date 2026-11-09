import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // =========================================================
  // NO LOGIN
  // =========================================================

  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  // =========================================================
  // PARSE USER
  // =========================================================

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error("Invalid user data:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }

  // =========================================================
  // NO VALID ROLE
  // =========================================================

  if (!user?.role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }

  // =========================================================
  // ROLE CHECK
  // =========================================================

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Customer
    if (user.role === "customer") {
      return <Navigate to="/customer/dashboard" replace />;
    }

    // Provider
    if (user.role === "provider") {
      return <Navigate to="/provider/dashboard" replace />;
    }

    // Admin
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Unknown role
    return <Navigate to="/login" replace />;
  }

  // =========================================================
  // AUTHORIZED
  // =========================================================

  return <Outlet />;
};

export default ProtectedRoute;
