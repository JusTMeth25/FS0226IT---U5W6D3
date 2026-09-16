package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "chat")
public record ChatProperties(History history, Duration streamTimeout) {

	public record History(int maxMessages) {
	}
}
