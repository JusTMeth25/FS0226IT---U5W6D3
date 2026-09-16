package com.example.demo.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameDTO(
		@NotBlank(message = "Il titolo non può essere vuoto")
		@Size(max = 100, message = "Il titolo non può superare i 100 caratteri")
		String title
) {
}
