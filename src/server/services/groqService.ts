// ==========================
// Groq Service - Core AI Engine
// ==========================

import { Request, Response } from 'express';

// Load API key from environment
const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
    console.error('❌ VITE_GROQ_API_KEY not set in environment!');
}

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqChatRequest {
    model: string;
    messages: Message[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}

interface GroqChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// System prompts for different features
export const SYSTEM_PROMPTS = {
    civic_companion: `You are JanAI – India's civic-tech assistant.

Your job is to help citizens:
- Understand government documents and policies
- Discover welfare schemes and benefits
- File complaints and access public services
- Navigate bureaucratic processes

Response Style:
• Always be concise and to the point (under 150 words)
• Use simple language anyone can understand
• Provide only the key actions or facts
• No long introductions or repetition
• Prefer lists or numbered steps
• If user asks for "more details", then expand
• End with a helpful tip or next step if relevant
• Be empathetic and supportive
• Use examples relevant to Indian context`,

    document_simplifier: `You are a government document expert for India.

Your role:
- Simplify complex government documents, forms, and legal text
- Explain bureaucratic jargon in simple terms
- Break down forms into easy steps
- Highlight key information citizens need to know

Response Style:
• Use very simple language (5th grade level)
• Break complex info into bullet points
• Highlight deadlines and requirements
• Explain consequences clearly
• Keep responses under 200 words
• Use Indian context and examples`,

    scheme_finder: `You are a welfare scheme expert for India.

Your role:
- Help citizens discover government schemes they're eligible for
- Compare different schemes
- Explain eligibility criteria clearly
- Guide on application process

Knowledge Areas:
- **State-level schemes (HIGHEST PRIORITY - always mention these FIRST)**
- District and local schemes
- Central Government schemes (PM-KISAN, Ayushman Bharat, PMAY, etc.)
- Agricultural subsidies
- Women & child welfare
- Senior citizen benefits
- Education scholarships

Response Style:
• **ALWAYS prioritize state/district-specific schemes when location is provided**
• List state schemes BEFORE central schemes
• Clearly label each scheme as State/Central/Local
• List scheme names and key benefits
• Clearly state eligibility criteria
• Mention required documents
• Provide application links/process
• Compare schemes when asked
• Keep responses practical and actionable
• Emphasize geo-specific benefits and local welfare programs

**OUTPUT FORMAT:**
When asked to find schemes, return ONLY a valid JSON array with no additional text.
Each scheme object must have: name, description, eligibility, benefits, requiredDocuments, applicationProcess, websiteLink, department, schemeType, category.`,

    complaint_assistant: `You are a civic complaint assistant for India.

Your role:
- Help citizens understand how to file complaints
- Guide them to the right department
- Explain the complaint resolution process
- Provide realistic timelines

Areas:
- Municipal issues (roads, water, garbage)
- Consumer complaints
- Police complaints
- Corruption complaints
- Public service issues

Response Style:
• Be empathetic and supportive
• Provide step-by-step guidance
• Mention relevant authorities
• Give realistic timeframes
• Suggest escalation paths if needed
• Keep responses under 150 words`,

    meeting_summarizer: `You are a Gram Sabha and community meeting summarizer.

Your role:
- Summarize meeting discussions clearly
- Extract key decisions and action items
- Highlight budget allocations
- Identify important deadlines
- Track attendance and participation

Response Style:
• Use clear, structured format
• Highlight decisions with action points
• Mention stakeholders and responsibilities
• Note budget allocations
• Keep summaries concise but comprehensive
• Use bullet points for clarity`
};

/**
 * Call Groq API with retry logic
 */
export async function callGroqAPI(
    messages: Message[],
    options: {
        temperature?: number;
        max_tokens?: number;
        model?: string;
    } = {}
): Promise<string> {
    const {
        temperature = 0.7,
        max_tokens = 512,
        model = 'llama-3.3-70b-versatile'
    } = options;

    const requestBody: GroqChatRequest = {
        model,
        messages,
        temperature,
        max_tokens,
    };

    console.log('📤 Sending request to Groq API...');
    console.log('Model:', model);
    console.log('Messages:', messages.length);

    const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Groq API error: ${response.status}`);
        console.error(`Error details:`, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data: GroqChatResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API');
    }

    const content = data.choices[0].message.content;
    console.log('✅ Groq API response received');
    console.log('Tokens used:', data.usage);

    return content;
}

/**
 * Generate response with system prompt
 */
export async function generateResponse(
    userMessage: string,
    systemPromptKey: keyof typeof SYSTEM_PROMPTS,
    conversationHistory: Message[] = [],
    options: {
        temperature?: number;
        max_tokens?: number;
    } = {}
): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[systemPromptKey];

    const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5), // Keep last 5 messages for context
        { role: 'user', content: userMessage }
    ];

    return callGroqAPI(messages, options);
}

/**
 * Extract structured data from text
 */
export async function extractStructuredData(
    text: string,
    schema: string,
    instructions: string
): Promise<any> {
    const prompt = `${instructions}

Input Text:
${text}

Expected Schema:
${schema}

Extract the information and return ONLY valid JSON matching the schema. No additional text.`;

    const messages: Message[] = [
        {
            role: 'system',
            content: 'You are a data extraction expert. Extract information accurately and return only valid JSON.'
        },
        {
            role: 'user',
            content: prompt
        }
    ];

    const response = await callGroqAPI(messages, {
        temperature: 0.1, // Low temperature for accuracy
        max_tokens: 1024
    });

    // Try to parse JSON from response
    try {
        // Remove markdown code blocks if present
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error('Failed to parse JSON response:', response);
        throw new Error('Failed to extract structured data');
    }
}

export default {
    callGroqAPI,
    generateResponse,
    extractStructuredData,
    SYSTEM_PROMPTS
};
