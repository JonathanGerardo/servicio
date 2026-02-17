package com.example.BackendServicio.models.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeviceResponse {
    private Integer id;
    private String nombre;
    private Double watts;
    private Double consumoKwh;
    private Double huellaCarbono;
}

