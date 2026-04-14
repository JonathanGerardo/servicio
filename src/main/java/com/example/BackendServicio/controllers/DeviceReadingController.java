package com.example.BackendServicio.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.BackendServicio.models.request.DeviceReadingRequest;
import com.example.BackendServicio.models.response.DeviceReadingResponse;
import com.example.BackendServicio.servicios.DeviceReadingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/readings")
@RequiredArgsConstructor
public class DeviceReadingController {

    private final DeviceReadingService deviceReadingService;

    @PostMapping
    public DeviceReadingResponse create(@Valid @RequestBody DeviceReadingRequest request) {
        return deviceReadingService.createReading(request);
    }

    @GetMapping("/device/{deviceId}")
    public List<DeviceReadingResponse> getByDevice(@PathVariable Integer deviceId) {
        return deviceReadingService.getReadingsByDevice(deviceId);
    }
}