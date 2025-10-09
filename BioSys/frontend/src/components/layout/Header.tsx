import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { brandConfig } from "../../utils/brandConfig";

const Header: React.FC = () => {
  const { state: cartState } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const [user, setUser] = useState<{
    username: string;
    id: string;
    email?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser({
            username: parsed?.name || parsed?.username || "",
            id: parsed?.id || "",
            email: parsed?.email || "",
            role: parsed?.role || "",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser({
            username: parsed?.name || parsed?.username || "",
            id: parsed?.id || "",
            email: parsed?.email || "",
            role: parsed?.role || "",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[TU_COLOR_PRINCIPAL] to-[TU_COLOR_HOVER] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-xl font-bold text-white">
                  {brandConfig.logo.icon}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 rounded-2xl transition-opacity duration-300 transform -skew-x-12"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                {brandConfig.name}
              </h1>
              <p className="text-xs text-gray-500 -mt-1">{brandConfig.slogan}</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { path: "/", label: "Inicio" },
              { path: "/products", label: "Productos" },
              { path: "/about", label: "Nosotros" },
              { path: "/contact", label: "Contacto" },
              { path: "/mascotas", label: "Mascotas" },
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActive(path)
                    ? "bg-lime-400 text-black shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {!user ? (
              <Link
                to="/login"
                className="bg-lime-400 text-black px-4 py-3 rounded-2xl font-medium shadow-lg hover:bg-lime-500 transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Iniciar sesión</span>
              </Link>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title={`Usuario: ${user.username}`}
                >
                  {getInitials(user.username)}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.username}
                      </p>
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.email}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/perfil"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Mi Perfil
                      </Link>

                      <Link
                        to="/mascotas"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        Mis Mascotas
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Panel Admin
                        </Link>
                      )}

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/cart" className="relative group">
              <div className="flex items-center space-x-3 bg-gray-900 text-white px-4 py-3 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                <div className="relative">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4H19m-10-4v6a2 2 0 104 0v-6m-4 0h4"
                    />
                  </svg>
                  {cartState.itemCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-lime-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartState.itemCount}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium">Carrito</span>
                  {cartState.total > 0 && (
                    <p className="text-xs text-gray-300 -mt-1">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                      }).format(cartState.total)}
                    </p>
                  )}
                </div>
              </div>
            </Link>

            <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav className="lg:hidden mt-4 flex justify-center space-x-1 overflow-x-auto pb-2">
          {[
            { path: "/", label: "Inicio", icon: "🏠" },
            { path: "/products", label: "Productos", icon: "🛍️" },
            { path: "/cart", label: "Carrito", icon: "🛒" },
            { path: "/about", label: "Nosotros", icon: "🏢" },
            { path: "/contact", label: "Contacto", icon: "📞" },
            { path: "/mascotas", label: "Mascotas", icon: "🐾" },
            !user
              ? { path: "/login", label: "Login", icon: "🔑" }
              : { path: "/", label: "Salir", icon: "🚪", key: "logout" },
          ].map(({ path, label, icon, key }) => (
            <Link
              key={key || path}
              to={path}
              onClick={() => label === "Salir" && handleLogout()}
              className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-0 flex-shrink-0 transition-all duration-200 ${
                isActive(path)
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg mb-1">{icon}</span>
              <span className="text-xs font-medium whitespace-nowrap">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
