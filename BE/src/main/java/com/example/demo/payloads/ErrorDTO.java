package com.example.demo.payloads;

import java.time.Instant;

public record ErrorDTO(String message, Instant timestamp) {

	public ErrorDTO(String message) {
		this(message, Instant.now());
	}
}
