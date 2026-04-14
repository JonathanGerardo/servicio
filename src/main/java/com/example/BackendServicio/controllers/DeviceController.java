package com.example.BackendServicio.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.BackendServicio.models.request.DeviceRegisterRequest;
import com.example.BackendServicio.models.request.DeviceUpdateRequest;
import com.example.BackendServicio.models.response.DeviceResponse;
import com.example.BackendServicio.servicios.DeviceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping("/register")
    public DeviceResponse register(@Valid @RequestBody DeviceRegisterRequest request) {
        return deviceService.registerDevice(request);
    }

    @GetMapping
    public List<DeviceResponse> getMyDevices() {
        return deviceService.getMyDevices();
    }

    @PutMapping("/{id}")
    public DeviceResponse update(@PathVariable Integer id, @Valid @RequestBody DeviceUpdateRequest request) {
        return deviceService.updateDevice(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        deviceService.deleteDevice(id);
    }
}