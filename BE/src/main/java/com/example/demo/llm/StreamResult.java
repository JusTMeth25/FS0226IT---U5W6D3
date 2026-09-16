package com.example.demo.llm;

/**
 * Outcome of a completed streaming call. Token counts are null when the
 * provider does not report usage.
 */
public record StreamResult(
		String content,
		String model,
		Integer promptTokens,
		Integer completionTokens,
		Integer totalTokens
) {
}
