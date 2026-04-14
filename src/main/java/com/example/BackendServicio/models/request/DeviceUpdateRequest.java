package com.example.BackendServicio.models.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceUpdateRequest {

    @Size(max = 100, message = "deviceName no puede exceder 100 caracteres")
    private String deviceName;

    @Size(max = 150, message = "ubicacion no puede exceder 150 caracteres")
    private String ubicacion;

    @Size(max = 100, message = "etiqueta no puede exceder 100 caracteres")
    private String etiqueta;

    private Boolean activo;
}