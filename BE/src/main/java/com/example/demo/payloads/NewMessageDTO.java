package com.example.demo.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewMessageDTO(
		@NotBlank(message = "Il messaggio non può essere vuoto")
		@Size(max = 8000, message = "Il messaggio non può superare gli 8000 caratteri")
		String content
) {
}
