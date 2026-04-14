import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/access/login", form);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Error en credenciales");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-subtitle">
          Accede para consultar tu consumo y huella de carbono.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <input
              className="app-input"
              placeholder="Ingresa tu correo"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              className="app-input"
              type="password"
              placeholder="Ingresa tu contraseña"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="app-button app-button-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}