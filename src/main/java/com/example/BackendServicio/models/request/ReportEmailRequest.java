package com.example.BackendServicio.models.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReportEmailRequest {

    @NotBlank(message = "El correo destino es obligatorio")
    @Email(message = "Debe ser un correo válido")
    private String to;
}