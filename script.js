const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat-button');

let aiSession = null;
let chatHistory = [];

async function initializeAI() {
    if (!aiSession) {
        const canCreate = await window.ai.canCreateTextSession();
        if (canCreate !== "no") {
            aiSession = await window.ai.createTextSession();
        } else {
            throw new Error("AI model is not available on this device.");
        }
    }
}

function addMessageToChatbox(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessageToChatbox(message, true);
        userInput.value = '';

        try {
            await initializeAI();

            chatHistory.push(`user: ${message}\n`);
            const fullPrompt = chatHistory.join('') + 'assistant:';

            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'ai-message';
            chatbox.appendChild(aiMessageDiv);

            let aiResponse = '';
            const stream = aiSession.promptStreaming(fullPrompt);
            let previousLength = 0;

            for await (const chunk of stream) {
                const newContent = chunk.slice(previousLength);
                aiResponse += newContent;
                aiMessageDiv.textContent = aiResponse;
                chatbox.scrollTop = chatbox.scrollHeight;
                previousLength = chunk.length;
            }

            chatHistory.push(`assistant: ${aiResponse}\n`);
        } catch (error) {
            console.error('Error:', error);
            addMessageToChatbox(`Error: ${error.message}`, false);
        }
    }
}

function startNewChat() {
    chatHistory = [];
    chatbox.innerHTML = '';
    if (aiSession) {
        aiSession.destroy();
        aiSession = null;
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
newChatButton.addEventListener('click', startNewChat);

// Initialize AI when the page loads
initializeAI().catch(error => {
    console.error('Error initializing AI:', error);
    addMessageToChatbox(`Error initializing AI: ${error.message}`, false);
});
