package com.example.demo.controllers;

import com.example.demo.payloads.ConversationDetailDTO;
import com.example.demo.payloads.ConversationSummaryDTO;
import com.example.demo.payloads.RenameDTO;
import com.example.demo.payloads.UsageDTO;
import com.example.demo.services.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

	private final ConversationService conversationService;

	@GetMapping
	public List<ConversationSummaryDTO> findAll() {
		return conversationService.findAll();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ConversationSummaryDTO create() {
		return conversationService.create();
	}

	@GetMapping("/{id}")
	public ConversationDetailDTO getDetail(@PathVariable UUID id) {
		return conversationService.getDetail(id);
	}

	@PatchMapping("/{id}")
	public ConversationSummaryDTO rename(@PathVariable UUID id, @RequestBody @Valid RenameDTO body) {
		return conversationService.rename(id, body.title());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		conversationService.delete(id);
	}

	@GetMapping("/{id}/usage")
	public UsageDTO getUsage(@PathVariable UUID id) {
		return conversationService.getUsage(id);
	}
}
