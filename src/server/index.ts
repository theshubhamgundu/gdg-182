import express from 'express';
import geminiRouter from './geminiProxy';
import openaiRouter from './openaiProxy';
import groqRouter from './groqProxy';
import apiRoutes from './apiRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for document processing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/gemini', geminiRouter);
app.use('/api/openai', openaiRouter);
app.use('/api/groq', groqRouter);
app.use('/api', apiRoutes); // Main API routes for all features

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint with full API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'JanAI Backend Server',
    version: '2.0.0',
    description: 'Complete backend for JanAI - Civic Tech AI Assistant',
    endpoints: {
      health: 'GET /health',

      civicCompanion: {
        chat: 'POST /api/companion/chat',
        history: 'GET /api/companion/history/:sessionId',
        suggestions: 'GET /api/companion/suggestions/:sessionId',
        clearSession: 'DELETE /api/companion/session/:sessionId'
      },

      documents: {
        analyze: 'POST /api/documents/analyze',
        simplify: 'POST /api/documents/simplify',
        extract: 'POST /api/documents/extract',
        compare: 'POST /api/documents/compare'
      },

      schemes: {
        find: 'POST /api/schemes/find',
        details: 'GET /api/schemes/:schemeName',
        compare: 'POST /api/schemes/compare',
        checkEligibility: 'POST /api/schemes/check-eligibility',
        byCategory: 'GET /api/schemes/category/:category'
      },

      complaints: {
        analyze: 'POST /api/complaints/analyze',
        submit: 'POST /api/complaints',
        getStatus: 'GET /api/complaints/:complaintId',
        userComplaints: 'GET /api/complaints/user/:userId',
        guidance: 'GET /api/complaints/guidance/:type'
      },

      meetings: {
        create: 'POST /api/meetings',
        list: 'GET /api/meetings',
        get: 'GET /api/meetings/:meetingId',
        summarize: 'POST /api/meetings/:meetingId/summarize',
        generateAgenda: 'POST /api/meetings/agenda/generate',
        askQuestion: 'POST /api/meetings/:meetingId/question',
        actionItems: 'GET /api/meetings/action-items'
      },

      ai: {
        groq: {
          generate: 'POST /api/groq/generate',
          debug: 'GET /api/groq/debug'
        }
      }
    },
    features: [
      'Civic Companion - AI-powered chat assistant',
      'Document Analysis - Simplify government documents',
      'Scheme Finder - Discover welfare schemes',
      'Complaint Management - File and track complaints',
      'Meeting Summarizer - Gram Sabha & community meetings'
    ],
    poweredBy: 'Groq (LLaMA 3.3 70B Versatile)'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🇮🇳 JanAI Backend Server - READY                ║
╠════════════════════════════════════════════════════╣
║ 🌐 Server: http://localhost:${PORT}                    ║
║                                                    ║
║ 🤖 AI Features:                                    ║
║   • Civic Companion Chat                          ║
║   • Document Analysis & Simplification            ║
║   • Government Scheme Finder                      ║
║   • Complaint Management System                   ║
║   • Meeting Summarizer (Gram Sabha)               ║
║                                                    ║
║ 🔌 API Endpoints:                                  ║
║   • /api/companion/*  - Chat assistant            ║
║   • /api/documents/*  - Document processing       ║
║   • /api/schemes/*    - Scheme discovery          ║
║   • /api/complaints/* - Complaint handling        ║
║   • /api/meetings/*   - Meeting management        ║
║   • /api/groq/*       - AI generation             ║
║                                                    ║
║ 🚀 Powered by: Groq (LLaMA 3.3 70B)               ║
║ 💚 Health Check: /health                          ║
║ 📖 API Docs: /                                    ║
╚════════════════════════════════════════════════════╝
  `);
});
