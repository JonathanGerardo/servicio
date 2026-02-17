package com.example.BackendServicio.servicios;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.BackendServicio.entidades.DeviceEntity;
import com.example.BackendServicio.entidades.UserEntity;
import com.example.BackendServicio.models.request.DeviceRequest;
import com.example.BackendServicio.models.response.CarbonFootprintSummaryResponse;
import com.example.BackendServicio.models.response.DeviceResponse;
import com.example.BackendServicio.repositorios.DeviceRepository;
import com.example.BackendServicio.repositorios.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    private static final double FACTOR_CO2 = 0.475;

    public DeviceResponse createDevice(DeviceRequest request) {

        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        UserEntity user = userRepository.findByUsername(username).orElseThrow();

        double watts = request.getVoltaje() * request.getCorriente();
        double consumoKwh = (watts * request.getHorasUsoDiario()) / 1000;
        double huella = consumoKwh * FACTOR_CO2;

        DeviceEntity device = DeviceEntity.builder()
                .nombre(request.getNombre())
                .voltaje(request.getVoltaje())
                .corriente(request.getCorriente())
                .horasUsoDiario(request.getHorasUsoDiario())
                .watts(watts)
                .consumoKwh(consumoKwh)
                .huellaCarbono(huella)
                .user(user)
                .build();

        DeviceEntity saved = deviceRepository.save(device);

        return DeviceResponse.builder()
                .id(saved.getId())
                .nombre(saved.getNombre())
                .watts(saved.getWatts())
                .consumoKwh(saved.getConsumoKwh())
                .huellaCarbono(saved.getHuellaCarbono())
                .build();
    }

    public List<DeviceResponse> getMyDevices() {

        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        UserEntity user = userRepository.findByUsername(username).orElseThrow();

        return deviceRepository.findByUserId(user.getId())
                .stream()
                .map(device -> DeviceResponse.builder()
                        .id(device.getId())
                        .nombre(device.getNombre())
                        .watts(device.getWatts())
                        .consumoKwh(device.getConsumoKwh())
                        .huellaCarbono(device.getHuellaCarbono())
                        .build())
                .toList();
    }

    public CarbonFootprintSummaryResponse getSummary() {

        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        UserEntity user = userRepository.findByUsername(username).orElseThrow();

        List<DeviceEntity> devices = deviceRepository.findByUserId(user.getId());

        double totalWatts = devices.stream()
                .mapToDouble(DeviceEntity::getWatts)
                .sum();

        double totalConsumo = devices.stream()
                .mapToDouble(DeviceEntity::getConsumoKwh)
                .sum();

        double totalHuella = devices.stream()
                .mapToDouble(DeviceEntity::getHuellaCarbono)
                .sum();

        return CarbonFootprintSummaryResponse.builder()
                .totalWatts(totalWatts)
                .totalConsumoKwh(totalConsumo)
                .totalHuellaCarbono(totalHuella)
                .build();
    }

    public void deleteDevice(Integer id) {
        deviceRepository.deleteById(id);
    }
}
