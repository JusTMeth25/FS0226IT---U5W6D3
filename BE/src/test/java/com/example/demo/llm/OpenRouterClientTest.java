package com.example.demo.llm;

import com.example.demo.config.OpenRouterProperties;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Runs the client against a fake OpenRouter server that replays scripted responses.
 */
class OpenRouterClientTest {

	private static final String OVERLOADED =
			"data: {\"error\":{\"code\":502,\"message\":\"Upstream error from Nvidia: Service temporarily overloaded\"}}\n\n";
	private static final String SUCCESS =
			"data: {\"model\":\"m\",\"choices\":[{\"delta\":{\"content\":\"Ciao\"}}]}\n\n"
					+ "data: {\"model\":\"m\",\"choices\":[{\"delta\":{\"content\":\" Lorenzo\"}}],"
					+ "\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":2,\"total_tokens\":12}}\n\n"
					+ "data: [DONE]\n\n";

	private record Scripted(int status, String body) {
	}

	private HttpServer server;
	private final Queue<Scripted> responses = new ConcurrentLinkedQueue<>();
	private final List<String> requestedModels = new ArrayList<>();

	@BeforeEach
	void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/chat/completions", exchange -> {
			String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
			Matcher matcher = Pattern.compile("\"model\":\"([^\"]+)\"").matcher(request);
			synchronized (requestedModels) {
				requestedModels.add(matcher.find() ? matcher.group(1) : "?");
			}
			Scripted next = responses.poll();
			byte[] body = next.body().getBytes(StandardCharsets.UTF_8);
			exchange.sendResponseHeaders(next.status(), body.length);
			try (OutputStream out = exchange.getResponseBody()) {
				out.write(body);
			}
		});
		server.start();
	}

	@AfterEach
	void stopServer() {
		server.stop(0);
	}

	private OpenRouterClient client(int maxRetries, List<String> fallbackModels) {
		OpenRouterProperties properties = new OpenRouterProperties(
				"http://127.0.0.1:" + server.getAddress().getPort(), "test-key", "main", fallbackModels,
				Duration.ofSeconds(5), maxRetries, Duration.ofMillis(5), true, "test", "http://localhost");
		return new OpenRouterClient(properties, JsonMapper.builder().build());
	}

	private static final List<ChatMessage> CONTEXT = List.of(ChatMessage.user("ciao"));

	@Test
	void retriesOverloadedModelThenSucceeds() {
		responses.add(new Scripted(200, OVERLOADED));
		responses.add(new Scripted(503, "{\"error\":\"busy\"}"));
		responses.add(new Scripted(200, SUCCESS));
		List<String> notes = new ArrayList<>();
		StringBuilder text = new StringBuilder();

		StreamResult result = client(2, List.of()).streamChat(CONTEXT, text::append, notes::add);

		assertThat(result.content()).isEqualTo("Ciao Lorenzo");
		assertThat(result.totalTokens()).isEqualTo(12);
		assertThat(text).hasToString("Ciao Lorenzo");
		assertThat(requestedModels).containsExactly("main", "main", "main");
		assertThat(notes).hasSize(2);
	}

	@Test
	void switchesToFallbackModelAfterRetries() {
		responses.add(new Scripted(200, OVERLOADED));
		responses.add(new Scripted(200, OVERLOADED));
		responses.add(new Scripted(200, SUCCESS));
		List<String> notes = new ArrayList<>();

		StreamResult result = client(1, List.of("vendor/backup:free")).streamChat(CONTEXT, t -> { }, notes::add);

		assertThat(result.content()).isEqualTo("Ciao Lorenzo");
		assertThat(requestedModels).containsExactly("main", "main", "vendor/backup:free");
		assertThat(notes.getLast()).contains("backup");
	}

	@Test
	void givesUpWithReadableMessageWhenEverythingIsOverloaded() {
		for (int i = 0; i < 4; i++) {
			responses.add(new Scripted(200, OVERLOADED));
		}

		assertThatThrownBy(() -> client(1, List.of("backup")).streamChat(CONTEXT, t -> { }, n -> { }))
				.isInstanceOf(LlmException.class)
				.hasMessageContaining("sovraccarichi")
				.hasMessageContaining("4 tentativi");
		assertThat(requestedModels).containsExactly("main", "main", "backup", "backup");
	}

	@Test
	void doesNotRetryPermanentErrors() {
		responses.add(new Scripted(401, "{\"error\":{\"message\":\"bad key\"}}"));

		assertThatThrownBy(() -> client(2, List.of("backup")).streamChat(CONTEXT, t -> { }, n -> { }))
				.isInstanceOf(LlmException.class)
				.hasMessageContaining("Chiave API");
		assertThat(requestedModels).containsExactly("main");
	}

	@Test
	void doesNotRetryOnceTextReachedTheUser() {
		responses.add(new Scripted(200,
				"data: {\"choices\":[{\"delta\":{\"content\":\"Ciao\"}}]}\n\n" + OVERLOADED));
		responses.add(new Scripted(200, SUCCESS));

		assertThatThrownBy(() -> client(2, List.of()).streamChat(CONTEXT, t -> { }, n -> { }))
				.isInstanceOf(LlmException.class);
		assertThat(requestedModels).containsExactly("main");
	}
}
