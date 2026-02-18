import React, { useState } from 'react';
import BluetoothReader from "../components/BluetoothReader";

export default function ConnectDevice() {
  const [lastReading, setLastReading] = useState(null);

  const handleData = () => {
    // Esta función se dispara cuando el BluetoothReader envía datos con éxito
    setLastReading(new Date().toLocaleTimeString());
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Vincular Equipo de Medición</h1>
      <p>Asegúrate de que el sensor esté encendido y cerca de tu computadora o celular.</p>
      
      <BluetoothReader onDataReceived={handleData} />

      {lastReading && (
        <div style={{ marginTop: "20px", color: "green" }}>
          ✅ Sincronizando datos en tiempo real. Última actualización: {lastReading}
        </div>
      )}
    </div>
  );
}