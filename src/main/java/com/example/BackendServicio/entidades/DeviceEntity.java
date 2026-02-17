package com.example.BackendServicio.entidades;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "device")
public class DeviceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nombre;

    private Double voltaje;
    private Double corriente;
    private Double horasUsoDiario;

    private Double watts;
    private Double consumoKwh;
    private Double huellaCarbono;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;
}
