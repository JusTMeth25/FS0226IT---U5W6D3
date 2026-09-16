package com.example.demo.services;

import com.example.demo.config.ChatProperties;
import com.example.demo.entities.Conversation;
import com.example.demo.entities.Message;
import com.example.demo.entities.MessageRole;
import com.example.demo.entities.TokenUsage;
import com.example.demo.exceptions.ConflictException;
import com.example.demo.llm.ChatMessage;
import com.example.demo.llm.LlmException;
import com.example.demo.llm.OpenRouterClient;
import com.example.demo.llm.StreamResult;
import com.example.demo.payloads.ErrorDTO;
import com.example.demo.payloads.MessageDTO;
import com.example.demo.repositories.ConversationRepository;
import com.example.demo.repositories.MessageRepository;
import com.example.demo.repositories.TokenUsageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Limit;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Handles a new user message: persists it, sends the conversation context to
 * the LLM, streams the answer to the client as SSE and persists the answer
 * together with the consumed tokens.
 * <p>
 * SSE events: {@code user} (saved user message), {@code delta} (text
 * fragment), {@code done} (saved assistant message + usage), {@code error}
 * (user-friendly message).
 */
@Slf4j
@Service
public class ChatService {

	private static final int TITLE_MAX_LENGTH = 40;

	private final ConversationService conversationService;
	private final ConversationRepository conversationRepository;
	private final MessageRepository messageRepository;
	private final TokenUsageRepository tokenUsageRepository;
	private final ContextBuilder contextBuilder;
	private final OpenRouterClient openRouterClient;
	private final TransactionTemplate transactionTemplate;
	private final ChatProperties chatProperties;

	public ChatService(ConversationService conversationService,
					   ConversationRepository conversationRepository,
					   MessageRepository messageRepository,
					   TokenUsageRepository tokenUsageRepository,
					   ContextBuilder contextBuilder,
					   OpenRouterClient openRouterClient,
					   TransactionTemplate transactionTemplate,
					   ChatProperties chatProperties) {
		this.conversationService = conversationService;
		this.conversationRepository = conversationRepository;
		this.messageRepository = messageRepository;
		this.tokenUsageRepository = tokenUsageRepository;
		this.contextBuilder = contextBuilder;
		this.openRouterClient = openRouterClient;
		this.transactionTemplate = transactionTemplate;
		this.chatProperties = chatProperties;
	}

	public SseEmitter sendMessage(UUID conversationId, String content) {
		Conversation conversation = conversationService.findById(conversationId);
		Message userMessage = saveUserMessage(conversation, content.strip());
		List<ChatMessage> context = contextBuilder.build(loadRecentHistory(conversationId));
		return startStream(conversation, userMessage, context);
	}

	/**
	 * Asks the agent again to answer the last user message, e.g. after a failed
	 * call. No new user message is saved.
	 */
	public SseEmitter regenerate(UUID conversationId) {
		Conversation conversation = conversationService.findById(conversationId);
		List<Message> history = loadRecentHistory(conversationId);
		if (history.isEmpty() || history.getLast().getRole() != MessageRole.USER) {
			throw new ConflictException("L'ultimo messaggio ha già una risposta: non c'è nulla da rigenerare.");
		}
		return startStream(conversation, null, contextBuilder.build(history));
	}

	private SseEmitter startStream(Conversation conversation, Message userMessage, List<ChatMessage> context) {
		SseEmitter emitter = new SseEmitter(chatProperties.streamTimeout().toMillis());
		Thread.startVirtualThread(() -> stream(conversation, userMessage, context, emitter));
		return emitter;
	}

	private void stream(Conversation conversation, Message userMessage, List<ChatMessage> context, SseEmitter emitter) {
		StreamSession session = new StreamSession(emitter);
		if (userMessage != null) {
			session.send("user", MessageDTO.from(userMessage));
		}
		try {
			StreamResult result = openRouterClient.streamChat(
					context,
					text -> session.send("delta", Map.of("text", text)),
					note -> session.send("status", Map.of("message", note)));
			Message assistantMessage = saveAssistantReply(conversation, result);
			session.send("done", Map.of(
					"message", MessageDTO.from(assistantMessage, result.totalTokens()),
					"usage", usageMap(result)));
		} catch (LlmException e) {
			log.warn("LLM call failed for conversation {}: {}", conversation.getId(), e.getMessage());
			session.send("error", new ErrorDTO(e.getMessage()));
		} catch (RuntimeException e) {
			log.error("Unexpected error while streaming conversation {}", conversation.getId(), e);
			session.send("error", new ErrorDTO("Si è verificato un errore interno. Riprova più tardi."));
		} finally {
			session.complete();
		}
	}

	private Message saveUserMessage(Conversation conversation, String content) {
		return transactionTemplate.execute(status -> {
			if (conversation.getTitle() == null) {
				conversation.setTitle(buildTitle(content));
			}
			conversation.touch();
			conversationRepository.save(conversation);
			return messageRepository.save(new Message(conversation, MessageRole.USER, content));
		});
	}

	private Message saveAssistantReply(Conversation conversation, StreamResult result) {
		return transactionTemplate.execute(status -> {
			Message assistantMessage = messageRepository.save(
					new Message(conversation, MessageRole.ASSISTANT, result.content()));

			TokenUsage usage = new TokenUsage();
			usage.setConversation(conversation);
			usage.setAssistantMessage(assistantMessage);
			usage.setModel(result.model());
			usage.setPromptTokens(result.promptTokens());
			usage.setCompletionTokens(result.completionTokens());
			usage.setTotalTokens(result.totalTokens());
			tokenUsageRepository.save(usage);

			conversation.touch();
			conversationRepository.save(conversation);
			log.info("Conversation {}: model={} promptTokens={} completionTokens={} totalTokens={}",
					conversation.getId(), result.model(), result.promptTokens(), result.completionTokens(), result.totalTokens());
			return assistantMessage;
		});
	}

	private List<Message> loadRecentHistory(UUID conversationId) {
		List<Message> recent = new ArrayList<>(messageRepository.findByConversationIdOrderByCreatedAtDesc(
				conversationId, Limit.of(contextBuilder.maxMessages())));
		Collections.reverse(recent);
		return recent;
	}

	private static String buildTitle(String content) {
		String singleLine = content.replaceAll("\\s+", " ");
		return singleLine.length() <= TITLE_MAX_LENGTH
				? singleLine
				: singleLine.substring(0, TITLE_MAX_LENGTH).strip() + "…";
	}

	private static Map<String, Object> usageMap(StreamResult result) {
		Map<String, Object> usage = new LinkedHashMap<>();
		usage.put("model", result.model());
		usage.put("promptTokens", result.promptTokens());
		usage.put("completionTokens", result.completionTokens());
		usage.put("totalTokens", result.totalTokens());
		return usage;
	}

	/**
	 * Wraps the emitter so a client disconnect does not stop the LLM call:
	 * the answer is still saved and visible when the chat is reopened.
	 */
	private static final class StreamSession {

		private final SseEmitter emitter;
		private volatile boolean clientConnected = true;

		StreamSession(SseEmitter emitter) {
			this.emitter = emitter;
			emitter.onTimeout(() -> clientConnected = false);
			emitter.onError(error -> clientConnected = false);
		}

		void send(String event, Object data) {
			if (!clientConnected) {
				return;
			}
			try {
				emitter.send(SseEmitter.event().name(event).data(data, MediaType.APPLICATION_JSON));
			} catch (Exception e) {
				clientConnected = false;
				log.debug("Client disconnected from stream: {}", e.getMessage());
			}
		}

		void complete() {
			if (clientConnected) {
				emitter.complete();
			}
		}
	}
}
