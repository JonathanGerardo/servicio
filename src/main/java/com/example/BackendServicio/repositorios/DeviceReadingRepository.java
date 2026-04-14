package com.example.BackendServicio.repositorios;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.BackendServicio.entidades.DeviceReadingEntity;

public interface DeviceReadingRepository extends JpaRepository<DeviceReadingEntity, Long> {
    List<DeviceReadingEntity> findByDeviceIdOrderByIdDesc(Integer deviceId);
}