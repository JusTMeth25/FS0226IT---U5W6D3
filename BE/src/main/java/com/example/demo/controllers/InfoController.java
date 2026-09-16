package com.example.demo.controllers;

import com.example.demo.config.ChatProperties;
import com.example.demo.config.OpenRouterProperties;
import com.example.demo.payloads.InfoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/info")
@RequiredArgsConstructor
public class InfoController {

	private final OpenRouterProperties openRouterProperties;
	private final ChatProperties chatProperties;

	@GetMapping
	public InfoDTO getInfo() {
		return new InfoDTO(
				openRouterProperties.model(),
				openRouterProperties.reasoningEnabled(),
				chatProperties.history().maxMessages(),
				openRouterProperties.hasApiKey() && openRouterProperties.model() != null && !openRouterProperties.model().isBlank());
	}
}
