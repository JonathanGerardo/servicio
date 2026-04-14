package com.example.BackendServicio.repositorios;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.BackendServicio.entidades.DeviceEntity;

public interface DeviceRepository extends JpaRepository<DeviceEntity, Integer> {
    List<DeviceEntity> findByUserId(Integer userId);
    Optional<DeviceEntity> findByDeviceUid(String deviceUid);
    Optional<DeviceEntity> findByIdAndUserId(Integer id, Integer userId);
    Optional<DeviceEntity> findByDeviceUidAndUserId(String deviceUid, Integer userId);
}