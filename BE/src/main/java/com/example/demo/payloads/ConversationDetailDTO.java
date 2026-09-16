package com.example.demo.payloads;

import java.util.List;

public record ConversationDetailDTO(ConversationSummaryDTO conversation, List<MessageDTO> messages) {
}
