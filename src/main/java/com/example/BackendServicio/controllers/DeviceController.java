package com.example.BackendServicio.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.BackendServicio.models.request.DeviceRequest;
import com.example.BackendServicio.models.response.CarbonFootprintSummaryResponse;
import com.example.BackendServicio.models.response.DeviceResponse;
import com.example.BackendServicio.servicios.DeviceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    public DeviceResponse create(@RequestBody DeviceRequest request) {
        return deviceService.createDevice(request);
    }

    @GetMapping
    public List<DeviceResponse> getMyDevices() {
        return deviceService.getMyDevices();
    }

    @GetMapping("/summary")
    public CarbonFootprintSummaryResponse getSummary() {
        return deviceService.getSummary();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        deviceService.deleteDevice(id);
    }
}

