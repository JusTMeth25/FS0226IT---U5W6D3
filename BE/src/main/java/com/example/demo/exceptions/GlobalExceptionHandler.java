package com.example.demo.exceptions;

import com.example.demo.llm.LlmException;
import com.example.demo.payloads.ErrorDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(NotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ErrorDTO handleNotFound(NotFoundException e) {
		return new ErrorDTO(e.getMessage());
	}

	@ExceptionHandler(ConflictException.class)
	@ResponseStatus(HttpStatus.CONFLICT)
	public ErrorDTO handleConflict(ConflictException e) {
		return new ErrorDTO(e.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ErrorDTO handleValidation(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getDefaultMessage())
				.collect(Collectors.joining(". "));
		return new ErrorDTO(message);
	}

	@ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ErrorDTO handleBadRequest(Exception e) {
		return new ErrorDTO("Richiesta non valida");
	}

	@ExceptionHandler(LlmException.class)
	public ResponseEntity<ErrorDTO> handleLlm(LlmException e) {
		return ResponseEntity.status(e.getHttpStatus()).body(new ErrorDTO(e.getMessage()));
	}

	@ExceptionHandler(NoResourceFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ErrorDTO handleNoResource(NoResourceFoundException e) {
		return new ErrorDTO("Risorsa non trovata");
	}

	@ExceptionHandler(AsyncRequestNotUsableException.class)
	public void handleClientDisconnected(AsyncRequestNotUsableException e) {
		// Client closed the stream: nothing can be written back
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ErrorDTO handleGeneric(Exception e) {
		log.error("Unexpected error", e);
		return new ErrorDTO("Si è verificato un errore interno. Riprova più tardi.");
	}
}
