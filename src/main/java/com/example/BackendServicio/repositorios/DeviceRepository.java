package com.example.BackendServicio.repositorios;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.BackendServicio.entidades.DeviceEntity;

public interface DeviceRepository extends JpaRepository<DeviceEntity, Integer> {
    List<DeviceEntity> findByUserId(Integer userId);
}
