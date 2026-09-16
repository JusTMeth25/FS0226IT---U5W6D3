package com.example.demo.payloads;

public record UsageDTO(long promptTokens, long completionTokens, long totalTokens, long calls) {
}
