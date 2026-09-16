package com.example.demo.services;

import com.example.demo.entities.Conversation;
import com.example.demo.entities.TokenUsage;
import com.example.demo.exceptions.NotFoundException;
import com.example.demo.payloads.ConversationDetailDTO;
import com.example.demo.payloads.ConversationSummaryDTO;
import com.example.demo.payloads.MessageDTO;
import com.example.demo.payloads.UsageDTO;
import com.example.demo.repositories.ConversationRepository;
import com.example.demo.repositories.MessageRepository;
import com.example.demo.repositories.TokenUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ConversationService {

	private final ConversationRepository conversationRepository;
	private final MessageRepository messageRepository;
	private final TokenUsageRepository tokenUsageRepository;

	public Conversation findById(UUID id) {
		return conversationRepository.findById(id).orElseThrow(() -> new NotFoundException(id));
	}

	public List<ConversationSummaryDTO> findAll() {
		return conversationRepository.findAllByOrderByUpdatedAtDesc().stream()
				.map(ConversationSummaryDTO::from)
				.toList();
	}

	public ConversationSummaryDTO create() {
		return ConversationSummaryDTO.from(conversationRepository.save(new Conversation()));
	}

	@Transactional(readOnly = true)
	public ConversationDetailDTO getDetail(UUID id) {
		Conversation conversation = findById(id);
		Map<UUID, Integer> tokensByMessage = new HashMap<>();
		for (TokenUsage usage : tokenUsageRepository.findByConversationId(id)) {
			if (usage.getAssistantMessage() != null && usage.getTotalTokens() != null) {
				tokensByMessage.put(usage.getAssistantMessage().getId(), usage.getTotalTokens());
			}
		}
		List<MessageDTO> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id).stream()
				.map(message -> MessageDTO.from(message, tokensByMessage.get(message.getId())))
				.toList();
		return new ConversationDetailDTO(ConversationSummaryDTO.from(conversation), messages);
	}

	@Transactional
	public ConversationSummaryDTO rename(UUID id, String title) {
		Conversation conversation = findById(id);
		conversation.setTitle(title.strip());
		conversation.touch();
		return ConversationSummaryDTO.from(conversation);
	}

	@Transactional
	public void delete(UUID id) {
		// Messages and token usages are removed by ON DELETE CASCADE foreign keys
		conversationRepository.delete(findById(id));
	}

	public UsageDTO getUsage(UUID id) {
		findById(id);
		List<TokenUsage> usages = tokenUsageRepository.findByConversationId(id);
		return new UsageDTO(
				sum(usages, TokenUsage::getPromptTokens),
				sum(usages, TokenUsage::getCompletionTokens),
				sum(usages, TokenUsage::getTotalTokens),
				usages.size());
	}

	private static long sum(List<TokenUsage> usages, Function<TokenUsage, Integer> field) {
		return usages.stream().map(field).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
	}
}
