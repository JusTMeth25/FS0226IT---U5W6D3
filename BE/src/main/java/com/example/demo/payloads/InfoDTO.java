package com.example.demo.payloads;

/**
 * Public, non-secret information about the agent configuration.
 * {@code aiConfigured} only says whether a key exists, never the key itself.
 */
public record InfoDTO(String model, boolean reasoningEnabled, int historyMaxMessages, boolean aiConfigured) {
}
