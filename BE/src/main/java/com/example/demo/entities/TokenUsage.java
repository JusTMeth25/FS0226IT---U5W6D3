package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;

/**
 * Tokens consumed by a single call to the LLM service.
 */
@Entity
@Table(name = "token_usages")
@Getter
@Setter
@NoArgsConstructor
public class TokenUsage {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "conversation_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Conversation conversation;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assistant_message_id")
	@OnDelete(action = OnDeleteAction.SET_NULL)
	private Message assistantMessage;

	private String model;

	private Integer promptTokens;

	private Integer completionTokens;

	private Integer totalTokens;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}
}
