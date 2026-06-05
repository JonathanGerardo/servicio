package com.example.BackendServicio.servicios;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.BackendServicio.entidades.DeviceEntity;
import com.example.BackendServicio.entidades.DeviceReadingEntity;
import com.example.BackendServicio.entidades.UserEntity;
import com.example.BackendServicio.excepciones.ResourceNotFoundException;
import com.example.BackendServicio.repositorios.DeviceReadingRepository;
import com.example.BackendServicio.repositorios.DeviceRepository;
import com.example.BackendServicio.repositorios.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceReadingRepository deviceReadingRepository;
    private final PdfReportService pdfReportService;
    private final EmailService emailService;

    public void sendDeviceReport(Integer deviceId, String to) {
        UserEntity user = getAuthenticatedUser();

        DeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        List<DeviceReadingEntity> readings =
            deviceReadingRepository.findByDeviceIdOrderByIdDesc(device.getId());

        byte[] pdfBytes = pdfReportService.generateDeviceReport(device, readings);

        String fileName = "reporte-" + cleanFileName(device.getDeviceName()) + ".pdf";

        emailService.sendPdfReport(
            to,
            "Reporte energético - " + device.getDeviceName(),
            "Adjunto encontrarás el reporte energético en formato PDF.",
            pdfBytes,
            fileName
        );
    }

    private UserEntity getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();

        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado no encontrado"));
    }

    private String cleanFileName(String value) {
    if (value == null || value.isBlank()) {
        return "dispositivo";
    }

    return value
        .trim()
        .replaceAll("[^a-zA-Z0-9-_]", "-")
        .replaceAll("-+", "-");
}
}