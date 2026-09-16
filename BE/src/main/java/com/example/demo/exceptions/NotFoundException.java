package com.example.demo.exceptions;

import java.util.UUID;

public class NotFoundException extends RuntimeException {

	public NotFoundException(UUID id) {
		super("Conversazione " + id + " non trovata");
	}
}
