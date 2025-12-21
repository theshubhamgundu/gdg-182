// ==========================
// API Routes - All Features
// ==========================

import express from 'express';
import civicCompanionService from './services/civicCompanionService';
import documentService from './services/documentService';
import schemeService from './services/schemeService';
import complaintService from './services/complaintService';
import meetingService from './services/meetingService';

const router = express.Router();

// =============================
// Civic Companion Routes
// =============================

router.post('/companion/chat', async (req, res) => {
    try {
        const { sessionId, userId, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await civicCompanionService.sendMessage(
            sessionId || `session-${Date.now()}`,
            userId || 'anonymous',
            message
        );

        res.json(result);
    } catch (error: any) {
        console.error('Civic companion error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/companion/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = civicCompanionService.getChatHistory(sessionId);
        res.json({ history });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/companion/suggestions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { context } = req.query;

        const suggestions = await civicCompanionService.getSuggestedQuestions(
            sessionId,
            context as string
        );

        res.json({ suggestions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/companion/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        civicCompanionService.clearChatSession(sessionId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// =============================
// Document Service Routes
// =============================

router.post('/documents/analyze', async (req, res) => {
    try {
        const { documentText, documentName } = req.body;

        if (!documentText) {
            return res.status(400).json({ error: 'Document text is required' });
        }

        const analysis = await documentService.analyzeDocument(documentText, documentName);
        res.json(analysis);
    } catch (error: any) {
        console.error('Document analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents/simplify', async (req, res) => {
    try {
        const { documentText, targetAudience } = req.body;

        if (!documentText) {
            return res.status(400).json({ error: 'Document text is required' });
        }

        const simplified = await documentService.simplifyDocument(
            documentText,
            targetAudience || 'general'
        );

        res.json({ simplified });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents/extract', async (req, res) => {
    try {
        const { documentText, query } = req.body;

        if (!documentText || !query) {
            return res.status(400).json({ error: 'Document text and query are required' });
        }

        const answer = await documentService.extractInformation(documentText, query);
        res.json({ answer });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents/compare', async (req, res) => {
    try {
        const { document1, document2, document1Name, document2Name } = req.body;

        if (!document1 || !document2) {
            return res.status(400).json({ error: 'Both documents are required' });
        }

        const comparison = await documentService.compareDocuments(
            document1,
            document2,
            document1Name,
            document2Name
        );

        res.json(comparison);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// =============================
// Scheme Finder Routes
// =============================

router.post('/schemes/find', async (req, res) => {
    try {
        const profile = req.body;
        const schemes = await schemeService.findSchemes(profile);
        res.json({ schemes });
    } catch (error: any) {
        console.error('Scheme finder error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/schemes/:schemeName', async (req, res) => {
    try {
        const { schemeName } = req.params;
        const scheme = await schemeService.getSchemeDetails(decodeURIComponent(schemeName));
        res.json(scheme);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/schemes/compare', async (req, res) => {
    try {
        const { schemeNames } = req.body;

        if (!Array.isArray(schemeNames) || schemeNames.length < 2) {
            return res.status(400).json({ error: 'At least 2 scheme names required' });
        }

        const comparison = await schemeService.compareSchemes(schemeNames);
        res.json(comparison);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/schemes/check-eligibility', async (req, res) => {
    try {
        const { schemeName, profile } = req.body;

        if (!schemeName || !profile) {
            return res.status(400).json({ error: 'Scheme name and profile are required' });
        }

        const eligibility = await schemeService.checkEligibility(schemeName, profile);
        res.json(eligibility);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/schemes/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { state } = req.query;

        const schemes = await schemeService.getSchemesByCategory(
            decodeURIComponent(category),
            state as string
        );

        res.json({ schemes });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// =============================
// Complaint Service Routes
// =============================

router.post('/complaints/analyze', async (req, res) => {
    try {
        const { type, description, location } = req.body;

        if (!type || !description) {
            return res.status(400).json({ error: 'Type and description are required' });
        }

        const analysis = await complaintService.analyzeComplaint(type, description, location);
        res.json(analysis);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/complaints', async (req, res) => {
    try {
        const { userId, type, description, location } = req.body;

        if (!type || !description) {
            return res.status(400).json({ error: 'Type and description are required' });
        }

        const complaint = await complaintService.submitComplaint(
            userId || 'anonymous',
            { type, description, location }
        );

        res.json({ complaint });
    } catch (error: any) {
        console.error('Complaint submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/complaints/:complaintId', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const complaint = await complaintService.getComplaintStatus(complaintId);

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/complaints/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const complaints = complaintService.getUserComplaints(userId);
        res.json({ complaints });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/complaints/guidance/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const guidance = await complaintService.getComplaintGuidance(decodeURIComponent(type));
        res.json(guidance);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// =============================
// Meeting Service Routes
// =============================

router.post('/meetings', async (req, res) => {
    try {
        const meetingData = req.body;
        const meeting = await meetingService.createMeeting(meetingData);
        res.json(meeting);
    } catch (error: any) {
        console.error('Meeting creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/meetings', (req, res) => {
    try {
        const { type, status, fromDate, toDate } = req.query;

        const meetings = meetingService.getAllMeetings({
            type: type as any,
            status: status as any,
            fromDate: fromDate as string,
            toDate: toDate as string
        });

        res.json({ meetings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/meetings/:meetingId', (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = meetingService.getMeetingById(meetingId);

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/meetings/:meetingId/summarize', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        const meeting = await meetingService.updateMeetingWithSummary(meetingId, transcript);

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error: any) {
        console.error('Meeting summarization error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/meetings/agenda/generate', async (req, res) => {
    try {
        const { meetingType, topics, previousMeetingIds } = req.body;

        if (!meetingType) {
            return res.status(400).json({ error: 'Meeting type is required' });
        }

        const previousMeetings = previousMeetingIds
            ? previousMeetingIds.map((id: string) => meetingService.getMeetingById(id)).filter(Boolean)
            : [];

        const agenda = await meetingService.generateAgenda(
            meetingType,
            previousMeetings,
            topics || []
        );

        res.json({ agenda });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/meetings/:meetingId/question', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const answer = await meetingService.answerMeetingQuestion(meetingId, question);
        res.json({ answer });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/meetings/action-items', (req, res) => {
    try {
        const { status, assignedTo } = req.query;

        const actionItems = meetingService.getActionItems({
            status: status as any,
            assignedTo: assignedTo as string
        });

        res.json({ actionItems });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
