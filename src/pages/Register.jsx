import { getFriendlyApiMessage } from "../utils/errorMessages";
import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = {
  nombre: "",
  username: "",
  password: "",
};

function maskEmail(email) {
  if (!email || !email.includes("@")) return email || "";

  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const firstLetter = local.charAt(0);
  const hidden = "*".repeat(Math.max(local.length - 1, 3));

  return `${firstLetter}${hidden}@${domain}`;
}

function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (!data) {
    return "No fue posible conectar con el servidor.";
  }

  if (data.details && typeof data.details === "object") {
    return Object.values(data.details).join(" ");
  }

  if (data.error) {
    return data.error;
  }

  if (data.message) {
    return data.message;
  }

  return fallback;
}

export default function Register() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [mode, setMode] = useState("register"); // register | verify
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const nombre = form.nombre.trim();
    const username = form.username.trim().toLowerCase();
    const password = form.password;

    if (!nombre || !username || !password) {
      setError("Completa nombre, correo y contraseña.");
      return;
    }

    if (!username.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/access/register", {
        nombre,
        username,
        password,
      });

      setPendingEmail(username);
      setMode("verify");
      setVerificationCode("");
      setSuccessMessage(
        res.data?.message ||
        `Código enviado a ${maskEmail(username)}. Revisa tu correo para verificar la cuenta.`
      );
    } catch (err) {
      console.error("Error técnico al registrar cuenta:", err);

      setError(
        getFriendlyApiMessage(
          err,
          "No fue posible registrar la cuenta. Inténtalo nuevamente."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const code = verificationCode.trim();

    if (!pendingEmail) {
      setError("No hay un correo pendiente de verificación.");
      setMode("register");
      return;
    }

    if (!code) {
      setError("Ingresa el código de verificación.");
      return;
    }

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/access/verify", {
        username: pendingEmail,
        code,
      });

      if (!res.data?.token) {
        setError("El servidor no devolvió un token válido.");
        return;
      }

      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error técnico al verificar código:", err);

      setError(
        getFriendlyApiMessage(
          err,
          "No fue posible verificar el código. Inténtalo nuevamente."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccessMessage("");

    if (!pendingEmail) {
      setError("No hay correo pendiente para reenviar código.");
      return;
    }

    setResending(true);

    try {
      const res = await api.post("/access/resend-code", {
        username: pendingEmail,
      });

      setVerificationCode("");
      setSuccessMessage(
        res.data?.message ||
        `Se envió un nuevo código a ${maskEmail(pendingEmail)}.`
      );
    } catch (err) {
      console.error("Error técnico al reenviar código:", err);

      setError(
        getFriendlyApiMessage(
          err,
          "No fue posible reenviar el código. Inténtalo nuevamente."
        )
      );
    } finally {
      setResending(false);
    }
  };

  const backToRegister = () => {
    setMode("register");
    setPendingEmail("");
    setVerificationCode("");
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {mode === "register" ? (
          <>
            <h2 className="auth-title">Crear cuenta</h2>

            <p className="auth-subtitle">
              Registra tu perfil. Después enviaremos un código a tu correo para
              verificar la cuenta.
            </p>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input
                  className="app-input"
                  name="nombre"
                  placeholder="Ingresa tu nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo electrónico</label>
                <input
                  className="app-input"
                  name="username"
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input
                  className="app-input"
                  name="password"
                  type="password"
                  placeholder="Crea una contraseña"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {error ? <div className="error-message">{error}</div> : null}

              {successMessage ? (
                <div className="success-message">{successMessage}</div>
              ) : null}

              <button
                className="app-button app-button-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Enviando código..." : "Registrarme"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">Verificar correo</h2>

            <p className="auth-subtitle">
              Código enviado a{" "}
              <strong className="auth-email-mask">
                {maskEmail(pendingEmail)}
              </strong>
              . Ingresa el código para activar tu cuenta.
            </p>

            <form className="auth-form" onSubmit={handleVerify}>
              <div className="input-group">
                <label className="input-label">Código de verificación</label>
                <input
                  className="app-input verification-code-input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    const cleanValue = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                    setVerificationCode(cleanValue);
                  }}
                  disabled={loading}
                />
              </div>

              {error ? <div className="error-message">{error}</div> : null}

              {successMessage ? (
                <div className="success-message">{successMessage}</div>
              ) : null}

              <button
                className="app-button app-button-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Verificar y entrar"}
              </button>

              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={handleResendCode}
                disabled={resending || loading}
              >
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>

              <button
                type="button"
                className="auth-link-button"
                onClick={backToRegister}
                disabled={loading || resending}
              >
                Cambiar correo
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}