package com.example.BackendServicio.servicios;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.BackendServicio.entidades.DeviceEntity;
import com.example.BackendServicio.entidades.UserEntity;
import com.example.BackendServicio.excepciones.ConflictException;
import com.example.BackendServicio.excepciones.ResourceNotFoundException;
import com.example.BackendServicio.models.request.DeviceRegisterRequest;
import com.example.BackendServicio.models.request.DeviceUpdateRequest;
import com.example.BackendServicio.models.response.DeviceResponse;
import com.example.BackendServicio.repositorios.DeviceRepository;
import com.example.BackendServicio.repositorios.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    private UserEntity getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado no encontrado"));
    }

    public DeviceResponse registerDevice(DeviceRegisterRequest request) {
        UserEntity user = getAuthenticatedUser();

        DeviceEntity device = deviceRepository.findByDeviceUid(request.getDeviceUid())
                .orElseGet(() -> {
                    DeviceEntity nuevo = DeviceEntity.builder()
                            .deviceUid(request.getDeviceUid())
                            .deviceName(request.getDeviceName().trim())
                            .bleName(request.getBleName())
                            .activo(true)
                            .registradoEn(LocalDateTime.now())
                            .ultimaConexion(LocalDateTime.now())
                            .user(user)
                            .build();

                    return deviceRepository.save(nuevo);
                });

        if (!device.getUser().getId().equals(user.getId())) {
            throw new ConflictException("El dispositivo ya está vinculado a otro usuario");
        }

        device.setUltimaConexion(LocalDateTime.now());

        if (request.getBleName() != null && !request.getBleName().isBlank()) {
            device.setBleName(request.getBleName().trim());
        }

        device = deviceRepository.save(device);

        return mapToResponse(device);
    }

    public List<DeviceResponse> getMyDevices() {
        UserEntity user = getAuthenticatedUser();

        return deviceRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public DeviceResponse updateDevice(Integer id, DeviceUpdateRequest request) {
        UserEntity user = getAuthenticatedUser();

        DeviceEntity device = deviceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        if (request.getDeviceName() != null && !request.getDeviceName().isBlank()) {
            device.setDeviceName(request.getDeviceName().trim());
        }

        if (request.getUbicacion() != null) {
            device.setUbicacion(request.getUbicacion().trim());
        }

        if (request.getEtiqueta() != null) {
            device.setEtiqueta(request.getEtiqueta().trim());
        }

        if (request.getActivo() != null) {
            device.setActivo(request.getActivo());
        }

        device = deviceRepository.save(device);

        return mapToResponse(device);
    }

    public void deleteDevice(Integer id) {
        UserEntity user = getAuthenticatedUser();

        DeviceEntity device = deviceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        deviceRepository.delete(device);
    }

    private DeviceResponse mapToResponse(DeviceEntity device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .deviceUid(device.getDeviceUid())
                .deviceName(device.getDeviceName())
                .bleName(device.getBleName())
                .ubicacion(device.getUbicacion())
                .etiqueta(device.getEtiqueta())
                .activo(device.getActivo())
                .registradoEn(device.getRegistradoEn())
                .ultimaConexion(device.getUltimaConexion())
                .build();
    }
}