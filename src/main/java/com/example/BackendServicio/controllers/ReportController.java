package com.example.BackendServicio.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.BackendServicio.models.request.ReportEmailRequest;
import com.example.BackendServicio.models.response.MessageResponse;
import com.example.BackendServicio.servicios.ReportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/device/{deviceId}/email")
    public ResponseEntity<MessageResponse> sendDeviceReport(
        @PathVariable Integer deviceId,
        @Valid @RequestBody ReportEmailRequest request
    ) {
        reportService.sendDeviceReport(deviceId, request.getTo());

        return ResponseEntity.ok(
            MessageResponse.builder()
                .message("Reporte enviado correctamente.")
                .build()
        );
    }
}