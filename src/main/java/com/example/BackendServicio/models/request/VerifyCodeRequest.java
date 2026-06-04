package com.example.BackendServicio.models.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyCodeRequest {

    @NotBlank(message = "El correo es obligatorio")
    private String username;

    @NotBlank(message = "El código es obligatorio")
    private String code;
}