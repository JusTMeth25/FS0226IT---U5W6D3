package com.example.demo.llm;

import lombok.Getter;

/**
 * Failure while talking to the LLM service. The message is safe to show to
 * the end user; technical details are logged, never exposed.
 */
@Getter
public class LlmException extends RuntimeException {

	private final int httpStatus;

	/** True for temporary problems (overload, rate limit, timeout) worth trying again */
	private final boolean retryable;

	public LlmException(String userMessage, int httpStatus) {
		this(userMessage, httpStatus, false, null);
	}

	public LlmException(String userMessage, int httpStatus, boolean retryable, Throwable cause) {
		super(userMessage, cause);
		this.httpStatus = httpStatus;
		this.retryable = retryable;
	}

	static LlmException fromStatus(int status) {
		return switch (status) {
			case 400 -> new LlmException("La richiesta al servizio AI non è valida. Controlla il modello configurato.", 502);
			case 401, 403 -> new LlmException("Chiave API del servizio AI non valida o non autorizzata.", 502);
			case 402 -> new LlmException("Credito del servizio AI esaurito.", 502);
			case 404 -> new LlmException("Il modello AI configurato non esiste o non è disponibile.", 502);
			case 408 -> new LlmException("Il servizio AI ha impiegato troppo tempo a rispondere. Riprova.", 504, true, null);
			case 429 -> new LlmException("Troppe richieste al servizio AI. Attendi qualche secondo e riprova.", 503, true, null);
			default -> status >= 500
					? new LlmException("Il servizio AI è sovraccarico o non disponibile. Riprova tra poco.", 503, true, null)
					: new LlmException("Errore imprevisto dal servizio AI.", 502);
		};
	}
}
