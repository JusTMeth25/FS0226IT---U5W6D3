package com.example.demo.controllers;

import com.example.demo.payloads.NewMessageDTO;
import com.example.demo.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/conversations/{id}")
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;

	/**
	 * Sends a message and streams the agent answer as Server-Sent Events.
	 * No "produces" on purpose: validation and 404 errors are returned as JSON
	 * before the stream starts.
	 */
	@PostMapping("/messages")
	public SseEmitter sendMessage(@PathVariable UUID id, @RequestBody @Valid NewMessageDTO body) {
		return chatService.sendMessage(id, body.content());
	}

	/**
	 * Streams a new answer to the last user message (same SSE events, without "user").
	 */
	@PostMapping("/regenerate")
	public SseEmitter regenerate(@PathVariable UUID id) {
		return chatService.regenerate(id);
	}
}
