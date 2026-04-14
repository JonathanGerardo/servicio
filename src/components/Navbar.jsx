import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkStyle = (active) => ({
    textDecoration: "none",
    color: active ? "#0f172a" : "#475569",
    fontWeight: active ? 700 : 500,
    padding: "8px 12px",
    borderRadius: "10px",
    background: active ? "#dbeafe" : "transparent",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "14px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          to={token ? "/dashboard" : "/"}
          style={{
            textDecoration: "none",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          EcoMonitor
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {token ? (
            <>
              <Link to="/dashboard" style={linkStyle(isActive("/dashboard"))}>
                Dashboard
              </Link>
              <Link to="/conectar" style={linkStyle(isActive("/conectar"))}>
                Conectar equipo
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/" style={linkStyle(isActive("/"))}>
                Login
              </Link>
              <Link to="/register" style={linkStyle(isActive("/register"))}>
                Registro
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}