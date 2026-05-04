import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/access/register", form);

      login(res.data.token);
      navigate("/dashboard");
    } catch {
      setError("No fue posible registrar la cuenta.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">
          Registra tu perfil para empezar a monitorear tus dispositivos.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nombre</label>
            <input
              className="app-input"
              placeholder="Ingresa tu nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <input
              className="app-input"
              placeholder="Ingresa tu correo"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              className="app-input"
              type="password"
              placeholder="Crea una contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error ? (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}

          <button className="app-button app-button-primary" type="submit">
            Registrarme
          </button>
        </form>
      </div>
    </div>
  );
}