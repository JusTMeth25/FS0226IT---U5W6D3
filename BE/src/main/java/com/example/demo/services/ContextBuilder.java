package com.example.demo.services;

import com.example.demo.agent.AgentInstructions;
import com.example.demo.config.ChatProperties;
import com.example.demo.entities.Message;
import com.example.demo.entities.MessageRole;
import com.example.demo.llm.ChatMessage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds the context sent to the model on every request, because the LLM
 * service keeps no memory between calls.
 * <p>
 * Strategy: the agent instructions as system prompt, followed by the last
 * {@code chat.history.max-messages} messages of the conversation in
 * chronological order (the new user message included).
 */
@Component
public class ContextBuilder {

	private final AgentInstructions instructions;
	private final int maxMessages;

	public ContextBuilder(AgentInstructions instructions, ChatProperties chatProperties) {
		this.instructions = instructions;
		this.maxMessages = chatProperties.history().maxMessages();
	}

	public int maxMessages() {
		return maxMessages;
	}

	/**
	 * @param history conversation messages in chronological order
	 */
	public List<ChatMessage> build(List<Message> history) {
		List<Message> window = history.subList(Math.max(0, history.size() - maxMessages), history.size());

		List<ChatMessage> context = new ArrayList<>(window.size() + 1);
		context.add(ChatMessage.system(instructions.content()));
		for (Message message : window) {
			context.add(message.getRole() == MessageRole.USER
					? ChatMessage.user(message.getContent())
					: ChatMessage.assistant(message.getContent()));
		}
		return context;
	}
}
