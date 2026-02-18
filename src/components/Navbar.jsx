import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={{ display: "flex", gap: "20px", padding: "10px", background: "#222", color: "white" }}>
      {token ? (
        <>
          <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>
          <Link to="/conectar" style={{ color: "white" }}>Conectar Sensor</Link> 
          <button onClick={handleLogout} style={{ marginLeft: "auto" }}>Cerrar sesión</button>
        </>
      ) : (
        <>
          <Link to="/" style={{ color: "white" }}>Login</Link>
          <Link to="/register" style={{ color: "white" }}>Registro</Link>
        </>
      )}
    </nav>
  );
}