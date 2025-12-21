// ==========================
// Civic Companion Service
// Chat-based AI assistant
// ==========================

import { generateResponse } from './groqService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatSession {
    sessionId: string;
    userId: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

// In-memory storage (replace with database in production)
const chatSessions: Map<string, ChatSession> = new Map();

/**
 * Create or get chat session
 */
export function getChatSession(sessionId: string, userId: string): ChatSession {
    if (!chatSessions.has(sessionId)) {
        const session: ChatSession = {
            sessionId,
            userId,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        chatSessions.set(sessionId, session);
        return session;
    }
    return chatSessions.get(sessionId)!;
}

/**
 * Send message and get AI response
 */
export async function sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string
): Promise<{ response: string; sessionId: string }> {
    const session = getChatSession(sessionId, userId);

    // Add user message to session
    session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
    });

    // Prepare conversation history for AI
    const conversationHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    // Get AI response
    const aiResponse = await generateResponse(
        userMessage,
        'civic_companion',
        conversationHistory.slice(-10) // Last 10 messages for context
    );

    // Add AI response to session
    session.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
    });

    session.updatedAt = Date.now();
    chatSessions.set(sessionId, session);

    return {
        response: aiResponse,
        sessionId
    };
}

/**
 * Get chat history
 */
export function getChatHistory(sessionId: string): Message[] {
    const session = chatSessions.get(sessionId);
    return session ? session.messages : [];
}

/**
 * Clear chat session
 */
export function clearChatSession(sessionId: string): void {
    chatSessions.delete(sessionId);
}

/**
 * Get suggested questions based on context
 */
export async function getSuggestedQuestions(
    sessionId: string,
    context?: string
): Promise<string[]> {
    const session = chatSessions.get(sessionId);
    const recentMessages = session?.messages.slice(-3) || [];

    const contextPrompt = context ||
        (recentMessages.length > 0
            ? `Recent conversation:\n${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
            : 'User is just starting to use JanAI');

    const prompt = `Based on this context, suggest 3 helpful follow-up questions a citizen might ask about government services, schemes, or civic issues in India.

${contextPrompt}

Return ONLY a JSON array of 3 short questions (max 10 words each). Example:
["How do I apply for ration card?", "What documents are required?", "How long does approval take?"]`;

    try {
        const response = await generateResponse(
            prompt,
            'civic_companion',
            [],
            { temperature: 0.8, max_tokens: 200 }
        );

        // Parse JSON response
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const questions = JSON.parse(cleaned);

        return Array.isArray(questions) ? questions.slice(0, 3) : [];
    } catch (error) {
        console.error('Error generating suggested questions:', error);
        return [
            'What government schemes am I eligible for?',
            'How do I file a complaint?',
            'Where can I find my documents?'
        ];
    }
}

export default {
    sendMessage,
    getChatHistory,
    clearChatSession,
    getSuggestedQuestions,
    getChatSession
};
