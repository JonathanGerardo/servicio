package com.example.BackendServicio.models.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceReadingResponse {
    private Long id;

    private Long epoch;
    private String isoTime;
    private Integer samples;

    private Double voltageAvg;
    private Double currentAvg;
    private Double powerAvg;
    private Double frequencyAvg;
    private Double pfAvg;
    private Double energyKwh;
    private Double carbonKg;
}