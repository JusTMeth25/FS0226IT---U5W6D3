package com.example.demo.repositories;

import com.example.demo.entities.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

	List<Conversation> findAllByOrderByUpdatedAtDesc();
}
