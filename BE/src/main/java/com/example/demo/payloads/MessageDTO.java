package com.example.demo.payloads;

import com.example.demo.entities.Message;
import com.example.demo.entities.MessageRole;

import java.time.Instant;
import java.util.UUID;

/**
 * @param tokens total tokens of the LLM call that produced this answer (assistant messages only)
 */
public record MessageDTO(UUID id, MessageRole role, String content, Instant createdAt, Integer tokens) {

	public static MessageDTO from(Message message) {
		return from(message, null);
	}

	public static MessageDTO from(Message message, Integer tokens) {
		return new MessageDTO(message.getId(), message.getRole(), message.getContent(), message.getCreatedAt(), tokens);
	}
}
