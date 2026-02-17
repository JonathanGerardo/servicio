package com.example.BackendServicio.models.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRequest {

    private String nombre;
    private Double voltaje;
    private Double corriente;
    private Double horasUsoDiario;
}
