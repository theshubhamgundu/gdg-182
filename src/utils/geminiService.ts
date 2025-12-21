// ==========================
// 🧩 JanAI Civic Companion
// Powered by Groq (LLaMA 3.3 70B)
// ==========================

// Load Groq API Key from environment only
let GROQ_API_KEY = '';

// ✅ Initialize Groq API Key
const initializeGroq = (): string => {
  if (GROQ_API_KEY) return GROQ_API_KEY;

  // Get from environment variable
  const envKey = (import.meta.env?.VITE_GROQ_API_KEY || '').trim();
  if (envKey && envKey.startsWith('gsk_')) {
    GROQ_API_KEY = envKey;
  }

  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_')) {
    throw new Error('Valid Groq API key required (should start with gsk_). Set VITE_GROQ_API_KEY in .env.local');
  }

  console.log('✅ Groq API key initialized');
  return GROQ_API_KEY;
};

// ==========================
// 🧠 Token Estimator Utility
// ==========================
const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 chars in English
  return Math.ceil(text.length / 4);
};

// ==========================
// 🔁 Groq API Caller
// ==========================
const callGroq = async (prompt: string, retries = 3): Promise<string> => {
  try {
    const apiKey = initializeGroq();
    if (!apiKey) {
      throw new Error('Failed to initialize Groq API key');
    }

    const tokenCount = estimateTokens(prompt);
    const MAX_SAFE_TOKENS = 3500; // soft limit per call to stay below 12k TPM
    if (tokenCount > MAX_SAFE_TOKENS) {
      console.warn(`⚠️ Trimming long prompt (${tokenCount} tokens > ${MAX_SAFE_TOKENS})`);
      prompt = prompt.slice(0, MAX_SAFE_TOKENS * 4); // trim chars safely
    }

    console.log('🚀 Sending request to Groq API...');
    const response = await fetch('/api/groq/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      }),
    });

    if (response.status === 429 && retries > 0) {
      console.warn(`⏳ Rate limited — retrying in 6s (${3 - retries + 1}/3)...`);
      await new Promise(res => setTimeout(res, 6000));
      return callGroq(prompt, retries - 1);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (!data.text) throw new Error('No text in response from AI');

    console.log(`✅ Using model: ${data.model}`);
    console.log(`📊 Estimated prompt tokens: ${tokenCount}`);
    console.log(`📦 AI response tokens: ~${estimateTokens(data.text)}`);

    return data.text.trim();

  } catch (err: any) {
    console.error('Groq proxy error:', err);
    throw new Error(`Failed to get AI response: ${err.message}`);
  }
};

// ==========================
// 🤖 JanAI Class
// ==========================
class GeminiCivicCompanion {
  private conversationHistory: Array<{ role: string; content: string }> = [];

  private systemPrompt = `
You are JanAI – India's civic-tech assistant.
Your goal is to respond clearly, briefly, and empathetically.
Use plain, simple English or the user's language.
Never exceed 120 words.
Summarize and guide users through steps when explaining.
`;

  async sendMessage(userMessage: string): Promise<string> {
    try {
      this.conversationHistory.push({ role: 'user', content: userMessage });

      const conversationContext = this.conversationHistory
        .slice(-5) // only keep last 5 turns to save tokens
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const prompt = `${this.systemPrompt}\n\n${conversationContext}`;

      const response = await callGroq(prompt);

      this.conversationHistory.push({ role: 'assistant', content: response });
      return response;
    } catch (err: any) {
      console.error('Groq API Error:', err);
      throw new Error(`AI failed: ${err.message}`);
    }
  }
}

export const civicCompanion = new GeminiCivicCompanion();
