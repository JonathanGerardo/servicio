package com.example.BackendServicio.models.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRegisterRequest {

    @NotBlank(message = "deviceUid es obligatorio")
    @Size(max = 100, message = "deviceUid no puede exceder 100 caracteres")
    private String deviceUid;

    @NotBlank(message = "deviceName es obligatorio")
    @Size(max = 100, message = "deviceName no puede exceder 100 caracteres")
    private String deviceName;

    @Size(max = 100, message = "bleName no puede exceder 100 caracteres")
    private String bleName;
}