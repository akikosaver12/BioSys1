import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-100">
      <h1 className="text-3xl font-bold text-green-700">🎉 Bienvenido a tu cuenta</h1>
    </div>
  );
};

export default Home;
