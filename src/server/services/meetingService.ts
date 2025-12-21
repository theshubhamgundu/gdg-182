// ==========================
// Meeting Service
// Gram Sabha and community meeting management
// ==========================

import { generateResponse, extractStructuredData } from './groqService';

export interface Meeting {
    id: string;
    title: string;
    type: 'Gram Sabha' | 'Ward Meeting' | 'Municipal Council' | 'Panchayat';
    date: string;
    location: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled';
    summary?: string;
    decisions?: string[];
    attendees?: number;
    budget?: string;
    agenda?: string[];
    actionItems?: Array<{
        description: string;
        assignedTo: string;
        deadline: string;
        status: 'Pending' | 'In Progress' | 'Completed';
    }>;
    rawTranscript?: string;
}

// In-memory storage
const meetings: Map<string, Meeting> = new Map();

// Initialize with some sample data
function initializeSampleMeetings() {
    const sampleMeetings: Meeting[] = [
        {
            id: 'meet-1',
            title: 'Monthly Gram Sabha - December 2024',
            type: 'Gram Sabha',
            date: '2024-12-15',
            location: 'Village Panchayat Hall',
            status: 'Completed',
            summary: 'Discussion on new water tank construction and road repairs in North Ward. Approved ₹5 Lakh budget for primary school painting. Community raised concerns about street lighting.',
            decisions: [
                'New water tank construction approved - ₹3L budget allocated',
                'Road repairs in Ward 2 prioritized for monsoon season',
                'School maintenance budget cleared - Work to start in January',
                'Street lighting survey to be conducted next week'
            ],
            attendees: 45,
            budget: '₹8.5L'
        },
        {
            id: 'meet-2',
            title: 'Ward 7 Community Meeting - December 2024',
            type: 'Ward Meeting',
            date: '2024-12-20',
            location: 'Community Center, Sector 7',
            status: 'Completed',
            summary: 'Urban ward meeting discussing waste management, park development, and local security. Residents voiced need for better street cleaning and CCTV installation.',
            decisions: [
                'Additional waste collection points approved for residential areas',
                'Park renovation project greenlit - ₹2L allocated',
                'CCTV installation proposal forwarded to municipal corporation'
            ],
            attendees: 78,
            budget: '₹4.5L'
        }
    ];

    sampleMeetings.forEach(meeting => meetings.set(meeting.id, meeting));
}

initializeSampleMeetings();

/**
 * Summarize meeting transcript
 */
export async function summarizeMeeting(
    transcript: string,
    meetingType: Meeting['type'],
    meetingTitle?: string
): Promise<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: Meeting['actionItems'];
    budgetDiscussed: string[];
}> {
    const prompt = `Summarize this ${meetingType} meeting transcript:

${meetingTitle ? `Meeting: ${meetingTitle}\n` : ''}
Transcript:
${transcript}

Provide:
1. Executive summary (3-4 sentences)
2. Key discussion points (5-8 bullet points)
3. Decisions taken (list all decisions)
4. Action items with responsibility and timeline
5. Budget allocations mentioned

Make it clear and easy for citizens to understand what was discussed and decided.`;

    const response = await generateResponse(
        prompt,
        'meeting_summarizer',
        [],
        { max_tokens: 1536 }
    );

    const schema = `{
  "summary": "string",
  "keyPoints": ["string"],
  "decisions": ["string"],
  "actionItems": [{
    "description": "string",
    "assignedTo": "string",
    "deadline": "string",
    "status": "Pending"
  }],
  "budgetDiscussed": ["string"]
}`;

    try {
        const extracted = await extractStructuredData(response, schema, `Extract from:\n${response}`);
        return {
            ...extracted,
            actionItems: extracted.actionItems || []
        };
    } catch (error) {
        return {
            summary: response,
            keyPoints: [],
            decisions: [],
            actionItems: [],
            budgetDiscussed: []
        };
    }
}

/**
 * Create a meeting
 */
export async function createMeeting(meetingData: Omit<Meeting, 'id'>): Promise<Meeting> {
    const meeting: Meeting = {
        ...meetingData,
        id: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    meetings.set(meeting.id, meeting);
    return meeting;
}

/**
 * Get all meetings
 */
export function getAllMeetings(
    filter?: {
        type?: Meeting['type'];
        status?: Meeting['status'];
        fromDate?: string;
        toDate?: string;
    }
): Meeting[] {
    let result = Array.from(meetings.values());

    if (filter) {
        if (filter.type) {
            result = result.filter(m => m.type === filter.type);
        }
        if (filter.status) {
            result = result.filter(m => m.status === filter.status);
        }
        if (filter.fromDate) {
            result = result.filter(m => m.date >= filter.fromDate!);
        }
        if (filter.toDate) {
            result = result.filter(m => m.date <= filter.toDate!);
        }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get meeting by ID
 */
export function getMeetingById(meetingId: string): Meeting | null {
    return meetings.get(meetingId) || null;
}

/**
 * Update meeting with summary
 */
export async function updateMeetingWithSummary(
    meetingId: string,
    transcript: string
): Promise<Meeting | null> {
    const meeting = meetings.get(meetingId);
    if (!meeting) return null;

    const summary = await summarizeMeeting(transcript, meeting.type, meeting.title);

    const updatedMeeting: Meeting = {
        ...meeting,
        summary: summary.summary,
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        rawTranscript: transcript
    };

    meetings.set(meetingId, updatedMeeting);
    return updatedMeeting;
}

/**
 * Generate meeting agenda
 */
export async function generateAgenda(
    meetingType: Meeting['type'],
    previousMeetings: Meeting[] = [],
    topics: string[] = []
): Promise<string[]> {
    const context = previousMeetings.length > 0
        ? `Previous meetings:\n${previousMeetings.map(m => `- ${m.title}: ${m.summary || 'No summary'}`).join('\n')}`
        : '';

    const topicsText = topics.length > 0
        ? `Suggested topics:\n${topics.map(t => `- ${t}`).join('\n')}`
        : '';

    const prompt = `Generate a comprehensive agenda for a ${meetingType} in India.

${context}
${topicsText}

Create 6-8 agenda items that are relevant and important for this type of meeting.
Include both regular items and specific issues that need attention.`;

    const response = await generateResponse(
        prompt,
        'meeting_summarizer',
        [],
        { temperature: 0.7, max_tokens: 512 }
    );

    // Extract agenda items
    const lines = response.split('\n')
        .filter(line => line.trim().match(/^[-•\d.]/))
        .map(line => line.replace(/^[-•\d.)\s]+/, '').trim())
        .filter(Boolean);

    return lines.length > 0 ? lines : [
        'Welcome and attendance',
        'Review of previous meeting decisions',
        'Status update on ongoing projects',
        'New proposals and discussions',
        'Budget allocation review',
        'Public grievances and issues',
        'Action items and next steps',
        'Closing remarks'
    ];
}

/**
 * Answer questions about a meeting
 */
export async function answerMeetingQuestion(
    meetingId: string,
    question: string
): Promise<string> {
    const meeting = meetings.get(meetingId);
    if (!meeting) {
        return 'Meeting not found.';
    }

    const meetingInfo = `
Meeting: ${meeting.title}
Date: ${meeting.date}
Type: ${meeting.type}
Location: ${meeting.location}
Status: ${meeting.status}
Summary: ${meeting.summary || 'No summary available'}
Decisions: ${meeting.decisions?.join(', ') || 'No decisions recorded'}
Attendees: ${meeting.attendees || 'Not recorded'}
Budget: ${meeting.budget || 'Not specified'}
${meeting.rawTranscript ? `\nTranscript: ${meeting.rawTranscript}` : ''}
`;

    const prompt = `Based on this meeting information, answer the question:

${meetingInfo}

Question: ${question}

Provide a clear, helpful answer based only on the available information.`;

    return generateResponse(
        prompt,
        'meeting_summarizer',
        [],
        { temperature: 0.3, max_tokens: 512 }
    );
}

/**
 * Track action items
 */
export function getActionItems(
    filter?: {
        status?: 'Pending' | 'In Progress' | 'Completed';
        assignedTo?: string;
    }
): Array<Meeting['actionItems'][0] & { meetingId: string; meetingTitle: string }> {
    const allActionItems: any[] = [];

    meetings.forEach((meeting) => {
        if (meeting.actionItems) {
            meeting.actionItems.forEach(item => {
                allActionItems.push({
                    ...item,
                    meetingId: meeting.id,
                    meetingTitle: meeting.title
                });
            });
        }
    });

    if (filter) {
        return allActionItems.filter(item => {
            if (filter.status && item.status !== filter.status) return false;
            if (filter.assignedTo && item.assignedTo !== filter.assignedTo) return false;
            return true;
        });
    }

    return allActionItems;
}

export default {
    summarizeMeeting,
    createMeeting,
    getAllMeetings,
    getMeetingById,
    updateMeetingWithSummary,
    generateAgenda,
    answerMeetingQuestion,
    getActionItems
};
