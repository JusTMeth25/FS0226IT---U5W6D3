package com.example.demo.llm;

import com.example.demo.config.OpenRouterProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Streaming client for the OpenRouter chat completions API (OpenAI-compatible
 * Server-Sent Events). The API key never leaves the backend.
 * <p>
 * Free models are often temporarily overloaded, so temporary failures are
 * retried with a growing wait, first on the main model and then on the
 * fallback models. A call is retried only if no text reached the user yet.
 */
@Slf4j
@Component
public class OpenRouterClient {

	private static final String DATA_PREFIX = "data:";
	private static final String DONE_MARKER = "[DONE]";

	private final OpenRouterProperties properties;
	private final JsonMapper jsonMapper;
	private final HttpClient httpClient;

	public OpenRouterClient(OpenRouterProperties properties, JsonMapper jsonMapper) {
		this.properties = properties;
		this.jsonMapper = jsonMapper;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(properties.timeout())
				.build();
	}

	/**
	 * Sends the conversation context and streams the answer.
	 *
	 * @param messages system prompt followed by the conversation history
	 * @param onDelta  receives each text fragment as soon as it arrives
	 * @param onRetry  receives a user-friendly note before each new attempt
	 * @return full answer text plus token usage
	 * @throws LlmException with a user-friendly message on any failure
	 */
	public StreamResult streamChat(List<ChatMessage> messages, Consumer<String> onDelta, Consumer<String> onRetry) {
		if (!properties.hasApiKey()) {
			throw new LlmException("Il servizio AI non è configurato: manca la chiave API.", 503);
		}
		if (isBlank(properties.model())) {
			throw new LlmException("Il servizio AI non è configurato: manca il modello.", 503);
		}

		Set<String> models = new LinkedHashSet<>();
		models.add(properties.model());
		models.addAll(properties.fallbackModels());

		boolean[] textSent = {false};
		Consumer<String> trackedDelta = text -> {
			textSent[0] = true;
			onDelta.accept(text);
		};

		int attempts = 0;
		boolean firstModel = true;
		LlmException lastFailure = null;
		for (String model : models) {
			for (int retry = 0; retry <= properties.maxRetries(); retry++) {
				if (lastFailure != null) {
					onRetry.accept(retryNote(model, firstModel, retry));
					pause(properties.retryBackoff().multipliedBy(Math.max(1, retry)));
				}
				attempts++;
				try {
					return streamOnce(model, messages, trackedDelta);
				} catch (LlmException e) {
					if (!e.isRetryable() || textSent[0]) {
						throw e;
					}
					log.warn("Attempt {} with model {} failed: {}", attempts, model, e.getMessage());
					lastFailure = e;
				}
			}
			firstModel = false;
		}

		throw new LlmException(
				"I server dei modelli AI sono sovraccarichi in questo momento (" + attempts
						+ " tentativi falliti). Riprova tra qualche minuto.",
				lastFailure.getHttpStatus(), false, lastFailure);
	}

	private StreamResult streamOnce(String model, List<ChatMessage> messages, Consumer<String> onDelta) {
		HttpRequest request = HttpRequest.newBuilder(URI.create(properties.baseUrl() + "/chat/completions"))
				.timeout(properties.timeout())
				.header("Authorization", "Bearer " + properties.apiKey())
				.header("Content-Type", "application/json")
				.header("Accept", "text/event-stream")
				.header("HTTP-Referer", properties.appUrl())
				.header("X-Title", properties.appName())
				.POST(HttpRequest.BodyPublishers.ofString(
						jsonMapper.writeValueAsString(ChatCompletionRequest.streaming(model, messages, properties.reasoningEnabled()))))
				.build();

		HttpResponse<Stream<String>> response;
		try {
			response = httpClient.send(request, HttpResponse.BodyHandlers.ofLines());
		} catch (HttpTimeoutException e) {
			throw new LlmException("Il servizio AI ha impiegato troppo tempo a rispondere. Riprova.", 504, true, e);
		} catch (IOException e) {
			throw new LlmException("Impossibile contattare il servizio AI. Verifica la connessione.", 503, true, e);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new LlmException("Richiesta al servizio AI interrotta.", 503, false, e);
		}

		try (Stream<String> lines = response.body()) {
			if (response.statusCode() / 100 != 2) {
				String body = lines.collect(Collectors.joining("\n"));
				log.warn("OpenRouter returned HTTP {} for model {}: {}", response.statusCode(), model, body);
				throw LlmException.fromStatus(response.statusCode());
			}
			return readStream(model, lines.iterator(), onDelta);
		} catch (JacksonException e) {
			log.error("Cannot parse OpenRouter stream", e);
			throw new LlmException("Risposta del servizio AI non leggibile.", 502, true, e);
		} catch (UncheckedIOException e) {
			throw new LlmException("Connessione con il servizio AI interrotta durante la risposta.", 503, true, e);
		}
	}

	private StreamResult readStream(String requestedModel, Iterator<String> lines, Consumer<String> onDelta) {
		StringBuilder content = new StringBuilder();
		String model = requestedModel;
		JsonNode usage = null;

		while (lines.hasNext()) {
			String line = lines.next().strip();
			// Blank lines separate events; lines starting with ':' are keep-alive comments
			if (!line.startsWith(DATA_PREFIX)) {
				continue;
			}
			String data = line.substring(DATA_PREFIX.length()).strip();
			if (DONE_MARKER.equals(data)) {
				break;
			}

			JsonNode chunk = jsonMapper.readTree(data);
			if (chunk.hasNonNull("error")) {
				log.warn("OpenRouter stream error for model {}: {}", requestedModel, chunk.get("error"));
				JsonNode code = chunk.get("error").path("code");
				throw LlmException.fromStatus(code.isNumber() ? code.asInt() : 500);
			}
			if (chunk.hasNonNull("model")) {
				model = chunk.get("model").asString();
			}
			if (chunk.hasNonNull("usage")) {
				usage = chunk.get("usage");
			}
			JsonNode delta = chunk.path("choices").path(0).path("delta").path("content");
			if (delta.isString() && !delta.asString().isEmpty()) {
				content.append(delta.asString());
				onDelta.accept(delta.asString());
			}
		}

		if (content.isEmpty()) {
			throw new LlmException("Il servizio AI ha restituito una risposta vuota. Riprova.", 502, true, null);
		}
		return new StreamResult(
				content.toString(),
				model,
				intOrNull(usage, "prompt_tokens"),
				intOrNull(usage, "completion_tokens"),
				intOrNull(usage, "total_tokens"));
	}

	private static String retryNote(String model, boolean firstModel, int retry) {
		String name = model.substring(model.lastIndexOf('/') + 1).replace(":free", "");
		if (retry == 0) {
			return "Il modello principale è sovraccarico: provo con " + name + "…";
		}
		return (firstModel ? "Il modello è sovraccarico" : name + " è sovraccarico")
				+ ": nuovo tentativo tra poco…";
	}

	private static void pause(Duration duration) {
		try {
			Thread.sleep(duration);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new LlmException("Richiesta al servizio AI interrotta.", 503, false, e);
		}
	}

	private static Integer intOrNull(JsonNode node, String field) {
		return node != null && node.path(field).isNumber() ? node.get(field).asInt() : null;
	}

	private static boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
