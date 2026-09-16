package com.example.demo.repositories;

import com.example.demo.entities.TokenUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TokenUsageRepository extends JpaRepository<TokenUsage, UUID> {

	List<TokenUsage> findByConversationId(UUID conversationId);
}
