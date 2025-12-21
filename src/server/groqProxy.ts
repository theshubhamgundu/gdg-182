// Backend proxy for Groq API calls

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load Groq API key from environment variables only
let GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || '';

// Try to load from .env.local file as fallback
if (!GROQ_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/VITE_GROQ_API_KEY=(.+)/);
      if (match && match[1].trim()) {
        GROQ_API_KEY = match[1].trim();
        console.log('✅ Loaded Groq API key from .env.local');
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not read .env.local file');
  }
}

if (GROQ_API_KEY) {
  console.log('✅ Groq API key loaded successfully');
} else {
  console.error('❌ No Groq API key found! Set VITE_GROQ_API_KEY in .env.local');
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqRequest {
  prompt: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
  };
}

// POST /api/groq/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body as GroqRequest;

    // Validate request
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from request header or environment
    const apiKey = req.headers['x-api-key'] as string || GROQ_API_KEY;

    if (!apiKey || !apiKey.startsWith('gsk_')) {
      console.error('❌ Invalid Groq API key');
      return res.status(401).json({
        error: 'Invalid or missing Groq API key',
        hint: 'Ensure VITE_GROQ_API_KEY is set in .env.local or environment, and starts with gsk_',
      });
    }

    console.log(`📝 Processing prompt with Groq API key: ${GROQ_API_KEY.substring(0, 10)}...`);

    try {
      console.log('📤 Sending request to Groq API...');
      const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are JanAI – India's civic-tech assistant.

Your job is to help citizens:
- Understand government documents
- Discover welfare schemes
- File complaints and access public services

Response Style:
• Always be concise and to the point (under 150 words)
• Use simple language anyone can understand
• Provide only the key actions or facts
• No long introductions or repetition
• Prefer lists or numbered steps
• If user asks for "more details", then expand
• End with a helpful tip or next step if relevant`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 512,
      };

      console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));

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
        console.error(`Error details: ${errorText}`);
        return res.status(response.status).json({
          error: `Groq API error: ${response.status}`,
          details: errorText.substring(0, 200),
        });
      }

      let data: GroqResponse;
      try {
        data = (await response.json()) as GroqResponse;
      } catch (parseErr) {
        console.error('❌ Failed to parse Groq response');
        return res.status(500).json({
          error: 'Invalid response from Groq',
        });
      }

      let text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.warn('⚠️ Groq returned no text');
        return res.status(500).json({
          error: 'No response from Groq',
        });
      }

      // Post-process: Trim to max 120 words for conciseness
      const words = text.trim().split(' ');
      if (words.length > 120) {
        text = words.slice(0, 120).join(' ') + '...';
        console.log('✂️ Trimmed response to 120 words');
      }

      console.log('✅ Success with Groq (llama-3.3-70b-versatile)');
      return res.json({
        success: true,
        model: 'llama-3.3-70b-versatile',
        text,
      });
    } catch (err: any) {
      console.error('❌ Groq request error:', err.message);
      return res.status(500).json({
        error: 'Failed to call Groq API',
        message: err.message,
      });
    }
  } catch (err: any) {
    console.error('❌ Groq proxy error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
});

// GET /api/groq/debug - Debug endpoint
router.get('/debug', (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    apiKeyLoaded: !!GROQ_API_KEY,
    apiKeyPreview: GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : 'not set',
    endpoint: GROQ_ENDPOINT,
    model: 'llama-3.3-70b-versatile',
  });
});

export default router;
