import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to={token ? "/dashboard" : "/"} className="navbar-brand">
        EcoMonitor
      </Link>

      <div className="navbar-links">
        <div className="navbar-spacer" />

        {token ? (
          <>
            <Link
              to="/dashboard"
              className={`navbar-link ${isActive("/dashboard") ? "navbar-link-active" : ""}`}
            >
              Dashboard
            </Link>

            <Link
              to="/conectar"
              className={`navbar-link ${isActive("/conectar") ? "navbar-link-active" : ""}`}
            >
              Conectar equipo
            </Link>

            <button className="app-button app-button-danger" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="navbar-link">
              Login
            </Link>
            <Link to="/register" className="navbar-link">
              Registro
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}