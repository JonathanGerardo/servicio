package com.example.BackendServicio.entidades;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "device",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"deviceUid"})
    }
)
public class DeviceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String deviceUid;

    @Column(nullable = false)
    private String deviceName;

    private String bleName;
    private String ubicacion;
    private String etiqueta;

    @Builder.Default
    private Boolean activo = true;

    private LocalDateTime registradoEn;
    private LocalDateTime ultimaConexion;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeviceReadingEntity> readings;
}