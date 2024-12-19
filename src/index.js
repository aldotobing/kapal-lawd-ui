// ...existing code...

function scrollToBottom() {
  const messageList = document.querySelector(".message-list");
  messageList.scrollTop = messageList.scrollHeight;
}

// Call this function whenever a new message is added by the assistant
function addAssistantMessage(message) {
  // ...existing code to add message...
  scrollToBottom();
}

// Optionally, call this function periodically while the assistant is typing
function simulateAssistantTyping() {
  // ...existing code for typing simulation...
  scrollToBottom();
}

// Add event listener to handle auto-scrolling as the assistant is typing
document.querySelector(".input-field").addEventListener("input", () => {
  scrollToBottom();
});

// ...existing code...
