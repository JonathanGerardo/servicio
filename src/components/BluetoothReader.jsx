import { useState, useEffect } from "react";
import api from "../api/api";

export default function BluetoothReader({ onDataReceived }) {
  const [status, setStatus] = useState("Desconectado");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Verificar si el navegador soporta la API al cargar
    if (!navigator.bluetooth) {
      setSupported(false);
      setStatus("Bluetooth no soportado en este navegador/protocolo");
    }
  }, []);

  const connectBT = async () => {
    try {
      setStatus("Buscando...");
      
      // 1. Pedir dispositivo (Abre la lista del navegador)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'] }]
      });

      // Manejar la desconexión inesperada
      device.addEventListener('gattserverdisconnected', () => {
        setStatus("Dispositivo desconectado");
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      const char = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');

      setStatus(`Conectado a ${device.name}`);

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', async (event) => {
        const view = event.target.value;
        const v = view.getFloat32(0, true); 
        const i = view.getFloat32(4, true);

        // Envío al backend usando tu instancia de axios
        await api.post("/devices/reading", { voltaje: v, corriente: i });
        if (onDataReceived) onDataReceived();
      });

    } catch (err) {
      console.error(err);
      if (err.name === 'NotFoundError') {
        setStatus("Cancelado por el usuario");
      } else {
        setStatus("Error: Asegúrate de usar HTTPS o Localhost");
      }
    }
  };

  if (!supported) {
    return (
      <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>
        ⚠️ Tu navegador o conexión (debe ser HTTPS) no permite el uso de Bluetooth.
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", borderRadius: "8px" }}>
      <h3>Panel de Control Bluetooth</h3>
      <p>Estado: <strong>{status}</strong></p>
      <button 
        onClick={connectBT}
        style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
      >
        {status.includes("Conectado") ? "Cambiar Dispositivo" : "Buscar y Conectar"}
      </button>
    </div>
  );
}