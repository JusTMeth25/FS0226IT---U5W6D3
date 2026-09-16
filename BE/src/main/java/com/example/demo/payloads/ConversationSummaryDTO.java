package com.example.demo.payloads;

import com.example.demo.entities.Conversation;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryDTO(UUID id, String title, Instant createdAt, Instant updatedAt) {

	public static final String DEFAULT_TITLE = "Nuova chat";

	public static ConversationSummaryDTO from(Conversation conversation) {
		String title = conversation.getTitle() == null ? DEFAULT_TITLE : conversation.getTitle();
		return new ConversationSummaryDTO(conversation.getId(), title, conversation.getCreatedAt(), conversation.getUpdatedAt());
	}
}
