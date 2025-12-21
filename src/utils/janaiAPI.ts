// ==========================
// JanAI API Client
// Frontend service to connect with backend
// ==========================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper function to handle API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// =============================
// Civic Companion API
// =============================

export const civicCompanionAPI = {
    /**
     * Send a message to the AI assistant
     */
    async sendMessage(message: string, sessionId?: string, userId?: string) {
        return apiCall('/companion/chat', {
            method: 'POST',
            body: JSON.stringify({
                message,
                sessionId: sessionId || `session-${Date.now()}`,
                userId: userId || 'user-' + Math.random().toString(36).substr(2, 9)
            })
        });
    },

    /**
     * Get chat history
     */
    async getHistory(sessionId: string) {
        return apiCall(`/companion/history/${sessionId}`);
    },

    /**
     * Get suggested questions
     */
    async getSuggestions(sessionId: string, context?: string) {
        const params = context ? `?context=${encodeURIComponent(context)}` : '';
        return apiCall(`/companion/suggestions/${sessionId}${params}`);
    },

    /**
     * Clear chat session
     */
    async clearSession(sessionId: string) {
        return apiCall(`/companion/session/${sessionId}`, {
            method: 'DELETE'
        });
    }
};

// =============================
// Document API
// =============================

export const documentAPI = {
    /**
     * Analyze a document
     */
    async analyze(documentText: string, documentName?: string) {
        return apiCall('/documents/analyze', {
            method: 'POST',
            body: JSON.stringify({ documentText, documentName })
        });
    },

    /**
     * Simplify a document
     */
    async simplify(documentText: string, targetAudience: 'child' | 'senior' | 'general' = 'general') {
        return apiCall('/documents/simplify', {
            method: 'POST',
            body: JSON.stringify({ documentText, targetAudience })
        });
    },

    /**
     * Extract information from document
     */
    async extractInfo(documentText: string, query: string) {
        return apiCall('/documents/extract', {
            method: 'POST',
            body: JSON.stringify({ documentText, query })
        });
    },

    /**
     * Compare two documents
     */
    async compare(document1: string, document2: string, document1Name?: string, document2Name?: string) {
        return apiCall('/documents/compare', {
            method: 'POST',
            body: JSON.stringify({ document1, document2, document1Name, document2Name })
        });
    }
};

// =============================
// Scheme Finder API
// =============================

export interface UserProfile {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    income?: number;
    location?: {
        state: string;
        district?: string;
    };
    category?: 'General' | 'SC' | 'ST' | 'OBC';
    hasDisability?: boolean;
    familySize?: number;
}

export const schemeAPI = {
    /**
     * Find schemes based on user profile
     */
    async findSchemes(profile: UserProfile) {
        return apiCall('/schemes/find', {
            method: 'POST',
            body: JSON.stringify(profile)
        });
    },

    /**
     * Get detailed information about a scheme
     */
    async getSchemeDetails(schemeName: string) {
        return apiCall(`/schemes/${encodeURIComponent(schemeName)}`);
    },

    /**
     * Compare multiple schemes
     */
    async compareSchemes(schemeNames: string[]) {
        return apiCall('/schemes/compare', {
            method: 'POST',
            body: JSON.stringify({ schemeNames })
        });
    },

    /**
     * Check eligibility for a scheme
     */
    async checkEligibility(schemeName: string, profile: UserProfile) {
        return apiCall('/schemes/check-eligibility', {
            method: 'POST',
            body: JSON.stringify({ schemeName, profile })
        });
    },

    /**
     * Get schemes by category
     */
    async getByCategory(category: string, state?: string) {
        const params = state ? `?state=${encodeURIComponent(state)}` : '';
        return apiCall(`/schemes/category/${encodeURIComponent(category)}${params}`);
    }
};

// =============================
// Complaint API
// =============================

export const complaintAPI = {
    /**
     * Analyze a complaint before submission
     */
    async analyze(type: string, description: string, location?: string) {
        return apiCall('/complaints/analyze', {
            method: 'POST',
            body: JSON.stringify({ type, description, location })
        });
    },

    /**
     * Submit a complaint
     */
    async submit(userId: string, type: string, description: string, location?: string) {
        return apiCall('/complaints', {
            method: 'POST',
            body: JSON.stringify({ userId, type, description, location })
        });
    },

    /**
     * Get complaint status
     */
    async getStatus(complaintId: string) {
        return apiCall(`/complaints/${complaintId}`);
    },

    /**
     * Get all complaints for a user
     */
    async getUserComplaints(userId: string) {
        return apiCall(`/complaints/user/${userId}`);
    },

    /**
     * Get guidance on filing a complaint
     */
    async getGuidance(type: string) {
        return apiCall(`/complaints/guidance/${encodeURIComponent(type)}`);
    }
};

// =============================
// Meeting API
// =============================

export interface Meeting {
    id?: string;
    title: string;
    type: 'Gram Sabha' | 'Ward Meeting' | 'Municipal Council' | 'Panchayat';
    date: string;
    location: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled';
    summary?: string;
    decisions?: string[];
    attendees?: number;
    budget?: string;
}

export const meetingAPI = {
    /**
     * Create a new meeting
     */
    async create(meeting: Meeting) {
        return apiCall('/meetings', {
            method: 'POST',
            body: JSON.stringify(meeting)
        });
    },

    /**
     * Get all meetings
     */
    async getAll(filter?: {
        type?: Meeting['type'];
        status?: Meeting['status'];
        fromDate?: string;
        toDate?: string;
    }) {
        const params = new URLSearchParams();
        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiCall(`/meetings${queryString}`);
    },

    /**
     * Get meeting by ID
     */
    async getById(meetingId: string) {
        return apiCall(`/meetings/${meetingId}`);
    },

    /**
     * Summarize a meeting with transcript
     */
    async summarize(meetingId: string, transcript: string) {
        return apiCall(`/meetings/${meetingId}/summarize`, {
            method: 'POST',
            body: JSON.stringify({ transcript })
        });
    },

    /**
     * Generate meeting agenda
     */
    async generateAgenda(meetingType: Meeting['type'], topics?: string[], previousMeetingIds?: string[]) {
        return apiCall('/meetings/agenda/generate', {
            method: 'POST',
            body: JSON.stringify({ meetingType, topics, previousMeetingIds })
        });
    },

    /**
     * Ask a question about a meeting
     */
    async askQuestion(meetingId: string, question: string) {
        return apiCall(`/meetings/${meetingId}/question`, {
            method: 'POST',
            body: JSON.stringify({ question })
        });
    },

    /**
     * Get action items
     */
    async getActionItems(filter?: {
        status?: 'Pending' | 'In Progress' | 'Completed';
        assignedTo?: string;
    }) {
        const params = new URLSearchParams();
        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiCall(`/meetings/action-items${queryString}`);
    }
};

// Export all APIs
export default {
    civicCompanion: civicCompanionAPI,
    document: documentAPI,
    scheme: schemeAPI,
    complaint: complaintAPI,
    meeting: meetingAPI
};
