package com.example.BackendServicio.models.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {
    private Integer id;
    private String deviceUid;
    private String deviceName;
    private String bleName;
    private String ubicacion;
    private String etiqueta;
    private Boolean activo;
    private LocalDateTime registradoEn;
    private LocalDateTime ultimaConexion;
}