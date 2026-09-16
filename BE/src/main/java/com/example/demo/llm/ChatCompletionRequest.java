package com.example.demo.llm;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatCompletionRequest(
		String model,
		List<ChatMessage> messages,
		boolean stream,
		@JsonProperty("stream_options") StreamOptions streamOptions,
		Reasoning reasoning
) {

	public record StreamOptions(@JsonProperty("include_usage") boolean includeUsage) {
	}

	/**
	 * OpenRouter reasoning tokens. The reasoning is not returned to the user:
	 * only the final answer is streamed and saved.
	 */
	public record Reasoning(boolean enabled) {
	}

	public static ChatCompletionRequest streaming(String model, List<ChatMessage> messages, boolean reasoningEnabled) {
		return new ChatCompletionRequest(model, messages, true, new StreamOptions(true),
				reasoningEnabled ? new Reasoning(true) : null);
	}
}
