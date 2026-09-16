package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "conversation_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Conversation conversation;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MessageRole role;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	public Message(Conversation conversation, MessageRole role, String content) {
		this.conversation = conversation;
		this.role = role;
		this.content = content;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}
}
