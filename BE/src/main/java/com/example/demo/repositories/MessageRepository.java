package com.example.demo.repositories;

import com.example.demo.entities.Message;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

	List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

	List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Limit limit);
}
