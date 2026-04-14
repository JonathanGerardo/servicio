package com.example.BackendServicio.servicios;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.BackendServicio.entidades.DeviceEntity;
import com.example.BackendServicio.entidades.DeviceReadingEntity;
import com.example.BackendServicio.entidades.UserEntity;
import com.example.BackendServicio.excepciones.ResourceNotFoundException;
import com.example.BackendServicio.models.request.DeviceReadingRequest;
import com.example.BackendServicio.models.response.DeviceReadingResponse;
import com.example.BackendServicio.repositorios.DeviceReadingRepository;
import com.example.BackendServicio.repositorios.DeviceRepository;
import com.example.BackendServicio.repositorios.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceReadingService {

    private final DeviceReadingRepository deviceReadingRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    private UserEntity getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado no encontrado"));
    }

    public DeviceReadingResponse createReading(DeviceReadingRequest request) {
        UserEntity user = getAuthenticatedUser();

        double emissionFactorKgPerKwh = 0.444;
        double carbonKg = request.getEnergyKwh() * emissionFactorKgPerKwh;

        DeviceEntity device = deviceRepository
                .findByDeviceUidAndUserId(request.getDeviceUid(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado para este usuario"));

        DeviceReadingEntity reading = DeviceReadingEntity.builder()
                .epoch(request.getEpoch())
                .isoTime(request.getIsoTime())
                .samples(request.getSamples())
                .voltageAvg(request.getVoltageAvg())
                .currentAvg(request.getCurrentAvg())
                .powerAvg(request.getPowerAvg())
                .frequencyAvg(request.getFrequencyAvg())
                .pfAvg(request.getPfAvg())
                .energyKwh(request.getEnergyKwh())
                .carbonKg(carbonKg)
                .device(device)
                .build();

        device.setUltimaConexion(LocalDateTime.now());
        deviceRepository.save(device);

        DeviceReadingEntity saved = deviceReadingRepository.save(reading);

        return mapToResponse(saved);
    }

    public List<DeviceReadingResponse> getReadingsByDevice(Integer deviceId) {
        UserEntity user = getAuthenticatedUser();

        DeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        return deviceReadingRepository.findByDeviceIdOrderByIdDesc(device.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private DeviceReadingResponse mapToResponse(DeviceReadingEntity reading) {
        return DeviceReadingResponse.builder()
                .id(reading.getId())
                .epoch(reading.getEpoch())
                .isoTime(reading.getIsoTime())
                .samples(reading.getSamples())
                .voltageAvg(reading.getVoltageAvg())
                .currentAvg(reading.getCurrentAvg())
                .powerAvg(reading.getPowerAvg())
                .frequencyAvg(reading.getFrequencyAvg())
                .pfAvg(reading.getPfAvg())
                .energyKwh(reading.getEnergyKwh())
                .carbonKg(reading.getCarbonKg())
                .build();
    }
}