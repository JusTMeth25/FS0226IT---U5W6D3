package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * @param fallbackModels models tried in order when the main model keeps failing with temporary errors
 * @param maxRetries     extra attempts on the same model before moving to the next one
 * @param retryBackoff   base wait between attempts (grows with each retry)
 */
@ConfigurationProperties(prefix = "openrouter")
public record OpenRouterProperties(
		String baseUrl,
		String apiKey,
		String model,
		List<String> fallbackModels,
		Duration timeout,
		int maxRetries,
		Duration retryBackoff,
		boolean reasoningEnabled,
		String appName,
		String appUrl
) {

	public OpenRouterProperties {
		fallbackModels = fallbackModels == null
				? List.of()
				: fallbackModels.stream().map(String::strip).filter(name -> !name.isEmpty()).toList();
		maxRetries = Math.max(0, maxRetries);
		retryBackoff = retryBackoff == null ? Duration.ofMillis(1500) : retryBackoff;
	}

	public boolean hasApiKey() {
		return apiKey != null && !apiKey.isBlank();
	}

	/**
	 * Never print the API key, even if this object ends up in a log.
	 */
	@Override
	public String toString() {
		return "OpenRouterProperties[baseUrl=" + baseUrl + ", apiKey=" + (hasApiKey() ? "****" : "<missing>")
				+ ", model=" + model + ", fallbackModels=" + fallbackModels + ", timeout=" + timeout
				+ ", maxRetries=" + maxRetries + ", retryBackoff=" + retryBackoff
				+ ", reasoningEnabled=" + reasoningEnabled + "]";
	}
}
