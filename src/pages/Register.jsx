import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post("/access/register", form);
    localStorage.setItem("token", res.data.token);
    navigate("/dashboard");
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
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

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
              placeholder="Crea una contraseña"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="app-button app-button-primary" type="submit">
            Registrarme
          </button>
        </form>
      </div>
    </div>
  );
}