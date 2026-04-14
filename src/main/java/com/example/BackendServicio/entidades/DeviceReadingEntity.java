package com.example.BackendServicio.entidades;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "device_reading")
public class DeviceReadingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private DeviceEntity device;
}