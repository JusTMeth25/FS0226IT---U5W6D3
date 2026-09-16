package com.example.demo.agent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Holds the agent system prompt. The prompt is read once at startup from the
 * file configured in {@code agent.instructions-location}; the application
 * refuses to start if the file is missing or empty.
 */
@Slf4j
@Component
public class AgentInstructions {

	private final String content;

	public AgentInstructions(ResourceLoader resourceLoader,
							 @Value("${agent.instructions-location}") String location) {
		Resource resource = resourceLoader.getResource(location);
		if (!resource.exists()) {
			throw new IllegalStateException("Agent instructions file not found: " + location);
		}
		try {
			this.content = resource.getContentAsString(StandardCharsets.UTF_8).strip();
		} catch (IOException e) {
			throw new IllegalStateException("Cannot read agent instructions file: " + location, e);
		}
		if (content.isEmpty()) {
			throw new IllegalStateException("Agent instructions file is empty: " + location);
		}
		log.info("Agent instructions loaded from {} ({} characters)", location, content.length());
	}

	public String content() {
		return content;
	}
}
