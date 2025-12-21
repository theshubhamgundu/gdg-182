// ==========================
// Complaint Service
// Civic complaint management and routing
// ==========================

import { generateResponse } from './groqService';

export interface Complaint {
    id: string;
    type: string;
    description: string;
    location: string;
    status: 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected';
    department: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    submittedAt: string;
    updatedAt: string;
    userId: string;
    assignedTo?: string;
    resolutionNotes?: string;
    estimatedResolutionDays?: number;
}

// In-memory storage
const complaints: Map<string, Complaint> = new Map();

/**
 * Analyze complaint and suggest department and priority
 */
export async function analyzeComplaint(
    complaintType: string,
    description: string,
    location?: string
): Promise<{
    suggestedDepartment: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    category: string;
    estimatedResolutionDays: number;
    actionable: boolean;
    suggestions: string[];
}> {
    const prompt = `Analyze this civic complaint:

Type: ${complaintType}
Description: ${description}
Location: ${location || 'Not specified'}

Determine:
1. Which government department should handle this
2. Priority level (Low/Medium/High/Critical)
3. Category of complaint
4. Estimated resolution time in days
5. Is it actionable? (yes/no)
6. Suggestions for the citizen on what to do

Common departments in India:
- Municipal Corporation
- Public Works Department (PWD)
- Water Supply Department
- Electricity Board
- Police Department
- Health Department
- Sanitation Department
- Traffic Police
- Consumer Protection

Provide practical guidance.`;

    const response = await generateResponse(
        prompt,
        'complaint_assistant',
        [],
        { temperature: 0.4, max_tokens: 512 }
    );

    // Parse response (simplified - in production use structured extraction)
    return {
        suggestedDepartment: extractDepartment(response),
        priority: extractPriority(response),
        category: complaintType,
        estimatedResolutionDays: extractEstimatedDays(response),
        actionable: true,
        suggestions: extractSuggestions(response)
    };
}

/**
 * Submit a complaint
 */
export async function submitComplaint(
    userId: string,
    complaintData: {
        type: string;
        description: string;
        location?: string;
    }
): Promise<Complaint> {
    // Analyze the complaint
    const analysis = await analyzeComplaint(
        complaintData.type,
        complaintData.description,
        complaintData.location
    );

    const complaint: Complaint = {
        id: `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: complaintData.type,
        description: complaintData.description,
        location: complaintData.location || 'Not specified',
        status: 'Submitted',
        department: analysis.suggestedDepartment,
        priority: analysis.priority,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        estimatedResolutionDays: analysis.estimatedResolutionDays
    };

    complaints.set(complaint.id, complaint);
    return complaint;
}

/**
 * Get complaint status and updates
 */
export async function getComplaintStatus(complaintId: string): Promise<Complaint | null> {
    return complaints.get(complaintId) || null;
}

/**
 * Get all complaints for a user
 */
export function getUserComplaints(userId: string): Complaint[] {
    return Array.from(complaints.values())
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

/**
 * Get guidance on filing a complaint
 */
export async function getComplaintGuidance(
    complaintType: string
): Promise<{
    steps: string[];
    requiredInfo: string[];
    expectedTimeline: string;
    escalationProcess: string;
}> {
    const prompt = `A citizen wants to file a "${complaintType}" complaint in India.

Provide:
1. Step-by-step guide on how to file this complaint
2. What information/documents they need to provide
3. Expected timeline for resolution
4. What to do if complaint is not resolved (escalation process)

Be specific and practical.`;

    const response = await generateResponse(
        prompt,
        'complaint_assistant',
        [],
        { max_tokens: 800 }
    );

    return {
        steps: extractSteps(response),
        requiredInfo: extractRequiredInfo(response),
        expectedTimeline: extractTimeline(response),
        escalationProcess: extractEscalation(response)
    };
}

/**
 * Generate follow-up message for complaint
 */
export async function generateFollowUp(complaint: Complaint): Promise<string> {
    const prompt = `Generate a follow-up message for this complaint:

Complaint ID: ${complaint.id}
Type: ${complaint.type}
Status: ${complaint.status}
Days since submission: ${Math.floor((Date.now() - new Date(complaint.submittedAt).getTime()) / (1000 * 60 * 60 * 24))}
Department: ${complaint.department}

What should the citizen do next? Provide helpful, actionable advice in 2-3 sentences.`;

    return generateResponse(
        prompt,
        'complaint_assistant',
        [],
        { temperature: 0.6, max_tokens: 256 }
    );
}

// Helper functions to extract information from AI response
function extractDepartment(response: string): string {
    const deptMatch = response.match(/department[:\s]+([^\n.]+)/i);
    return deptMatch ? deptMatch[1].trim() : 'Municipal Corporation';
}

function extractPriority(response: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const priorityMatch = response.match(/priority[:\s]+(low|medium|high|critical)/i);
    if (!priorityMatch) return 'Medium';

    const priority = priorityMatch[1].toLowerCase();
    if (priority === 'critical') return 'Critical';
    if (priority === 'high') return 'High';
    if (priority === 'low') return 'Low';
    return 'Medium';
}

function extractEstimatedDays(response: string): number {
    const daysMatch = response.match(/(\d+)\s*days?/i);
    return daysMatch ? parseInt(daysMatch[1]) : 15;
}

function extractSuggestions(response: string): string[] {
    // Simple extraction - can be improved
    const lines = response.split('\n').filter(line =>
        line.trim().startsWith('-') ||
        line.trim().startsWith('•') ||
        /^\d+\./.test(line.trim())
    );
    return lines.map(line => line.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean);
}

function extractSteps(response: string): string[] {
    return extractSuggestions(response);
}

function extractRequiredInfo(response: string): string[] {
    return extractSuggestions(response);
}

function extractTimeline(response: string): string {
    const timelineMatch = response.match(/timeline[:\s]+([^\n]+)/i);
    return timelineMatch ? timelineMatch[1].trim() : '15-30 days typically';
}

function extractEscalation(response: string): string {
    const escalationMatch = response.match(/escalation[:\s]+([^\n]+)/i);
    return escalationMatch ? escalationMatch[1].trim() : 'Contact senior officials or file RTI';
}

export default {
    analyzeComplaint,
    submitComplaint,
    getComplaintStatus,
    getUserComplaints,
    getComplaintGuidance,
    generateFollowUp
};
