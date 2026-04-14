package com.example.BackendServicio.models.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceReadingRequest {

    @NotBlank(message = "deviceUid es obligatorio")
    private String deviceUid;

    @NotNull(message = "epoch es obligatorio")
    @Positive(message = "epoch debe ser positivo")
    private Long epoch;

    private String isoTime;

    @NotNull(message = "samples es obligatorio")
    @Positive(message = "samples debe ser mayor que cero")
    private Integer samples;

    @NotNull(message = "voltageAvg es obligatorio")
    @PositiveOrZero(message = "voltageAvg no puede ser negativo")
    private Double voltageAvg;

    @NotNull(message = "currentAvg es obligatorio")
    @PositiveOrZero(message = "currentAvg no puede ser negativo")
    private Double currentAvg;

    @NotNull(message = "powerAvg es obligatorio")
    @PositiveOrZero(message = "powerAvg no puede ser negativo")
    private Double powerAvg;

    @NotNull(message = "frequencyAvg es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "frequencyAvg no puede ser negativo")
    private Double frequencyAvg;

    @NotNull(message = "pfAvg es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "pfAvg no puede ser negativo")
    private Double pfAvg;

    @NotNull(message = "energyKwh es obligatorio")
    @PositiveOrZero(message = "energyKwh no puede ser negativo")
    private Double energyKwh;
}