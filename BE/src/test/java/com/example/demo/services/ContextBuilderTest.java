package com.example.demo.services;

import com.example.demo.agent.AgentInstructions;
import com.example.demo.config.ChatProperties;
import com.example.demo.entities.Message;
import com.example.demo.entities.MessageRole;
import com.example.demo.llm.ChatMessage;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.time.Duration;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class ContextBuilderTest {

	private final AgentInstructions instructions =
			new AgentInstructions(new DefaultResourceLoader(), "classpath:agent/instructions.md");

	private ContextBuilder builder(int maxMessages) {
		return new ContextBuilder(instructions, new ChatProperties(new ChatProperties.History(maxMessages), Duration.ofMinutes(1)));
	}

	private static List<Message> history(int size) {
		return IntStream.range(0, size)
				.mapToObj(i -> new Message(null, i % 2 == 0 ? MessageRole.USER : MessageRole.ASSISTANT, "m" + i))
				.toList();
	}

	@Test
	void systemPromptComesFirst() {
		List<ChatMessage> context = builder(10).build(history(2));

		assertThat(context.getFirst().role()).isEqualTo("system");
		assertThat(context.getFirst().content()).isEqualTo(instructions.content());
	}

	@Test
	void keepsWholeHistoryUnderLimitInOrder() {
		List<ChatMessage> context = builder(10).build(history(3));

		assertThat(context).extracting(ChatMessage::content).containsExactly(instructions.content(), "m0", "m1", "m2");
		assertThat(context).extracting(ChatMessage::role).containsExactly("system", "user", "assistant", "user");
	}

	@Test
	void keepsOnlyLastMessagesOverLimit() {
		List<ChatMessage> context = builder(3).build(history(8));

		assertThat(context).hasSize(4);
		assertThat(context).extracting(ChatMessage::content).containsExactly(instructions.content(), "m5", "m6", "m7");
	}
}
