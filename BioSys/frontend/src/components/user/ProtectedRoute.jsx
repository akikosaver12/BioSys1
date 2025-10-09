// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // Si la ruta requiere ser admin
  if (role && user.role !== role) {
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;
