// ====================================================
// QUICK INTEGRATION GUIDE
// How to use the backend in your frontend components
// ====================================================

import janaiAPI from '@/utils/janaiAPI';

// ====================================================
// 1. CIVIC COMPANION INTEGRATION
// ====================================================

// Example: Update CivicCompanion.tsx component
const handleSendMessage = async (userMessage: string) => {
    try {
        setLoading(true);

        // Call backend API
        const response = await janaiAPI.civicCompanion.sendMessage(
            userMessage,
            sessionId,  // Store this in state
            userId      // Get from auth
        );

        // Update UI with response
        setMessages([...messages, {
            role: 'assistant',
            content: response.response,
            timestamp: Date.now()
        }]);

        setLoading(false);
    } catch (error) {
        console.error('Chat error:', error);
        setError('Failed to get response');
    }
};

// Get suggested questions
const loadSuggestions = async () => {
    const result = await janaiAPI.civicCompanion.getSuggestions(sessionId);
    setSuggestedQuestions(result.suggestions);
};

// ====================================================
// 2. DOCUMENT ANALYSIS INTEGRATION
// ====================================================

// Example: Update DocumentWallet.tsx or create DocumentAnalyzer component
const handleDocumentUpload = async (file: File) => {
    try {
        // Read file content
        const documentText = await readFileContent(file);

        // Analyze with backend
        const analysis = await janaiAPI.document.analyze(
            documentText,
            file.name
        );

        // Display results
        setAnalysis({
            type: analysis.documentType,
            summary: analysis.summary,
            keyPoints: analysis.keyPoints,
            actions: analysis.requiredActions,
            deadlines: analysis.deadlines,
            simplified: analysis.simplifiedText
        });

    } catch (error) {
        console.error('Analysis error:', error);
    }
};

// Simplify document
const handleSimplify = async () => {
    const result = await janaiAPI.document.simplify(
        documentText,
        'senior' // or 'child' or 'general'
    );

    setSimplifiedText(result.simplified);
};

// ====================================================
// 3. SCHEME FINDER INTEGRATION
// ====================================================

// Example: Update SchemeFinder.tsx component
const handleFindSchemes = async (userProfile) => {
    try {
        setLoading(true);

        // Build profile from user data
        const profile = {
            age: parseInt(userProfile.age),
            gender: userProfile.gender,
            occupation: userProfile.occupation,
            income: parseInt(userProfile.income),
            location: {
                state: userProfile.state,
                district: userProfile.district
            },
            category: userProfile.category,
            hasDisability: userProfile.hasDisability === 'yes',
            familySize: parseInt(userProfile.familySize)
        };

        // Find schemes from backend
        const result = await janaiAPI.scheme.findSchemes(profile);

        // Update UI
        setSchemes(result.schemes);
        setLoading(false);

    } catch (error) {
        console.error('Scheme finder error:', error);
    }
};

// Check eligibility for specific scheme
const checkEligibility = async (schemeName: string) => {
    const result = await janaiAPI.scheme.checkEligibility(
        schemeName,
        userProfile
    );

    if (result.eligible) {
        alert('You are eligible! ' + result.reasons.join(', '));
    } else {
        alert('Not eligible. Missing: ' + result.missingCriteria.join(', '));
    }
};

// Get scheme details
const viewSchemeDetails = async (schemeName: string) => {
    const scheme = await janaiAPI.scheme.getSchemeDetails(schemeName);
    setSelectedScheme(scheme);
    setShowDetails(true);
};

// ====================================================
// 4. COMPLAINT MANAGEMENT INTEGRATION
// ====================================================

// Example: Update ComplaintSupport.tsx component
const handleSubmitComplaint = async (formData) => {
    try {
        setSubmitting(true);

        // First, analyze to get suggestions
        const analysis = await janaiAPI.complaint.analyze(
            formData.type,
            formData.description,
            formData.location
        );

        // Show suggested department and priority
        console.log('Suggested department:', analysis.suggestedDepartment);
        console.log('Priority:', analysis.priority);
        console.log('Estimated resolution:', analysis.estimatedResolutionDays, 'days');

        // Submit complaint
        const result = await janaiAPI.complaint.submit(
            userId,
            formData.type,
            formData.description,
            formData.location
        );

        // Show success
        setComplaint(result.complaint);
        setShowSuccess(true);
        setSubmitting(false);

    } catch (error) {
        console.error('Complaint submission error:', error);
    }
};

// Get user's complaints
const loadUserComplaints = async () => {
    const result = await janaiAPI.complaint.getUserComplaints(userId);
    setComplaints(result.complaints);
};

// Get complaint status
const checkComplaintStatus = async (complaintId: string) => {
    const complaint = await janaiAPI.complaint.getStatus(complaintId);
    setSelectedComplaint(complaint);
};

// Get filing guidance
const getGuidance = async (complaintType: string) => {
    const guidance = await janaiAPI.complaint.getGuidance(complaintType);
    setGuidanceInfo({
        steps: guidance.steps,
        requiredInfo: guidance.requiredInfo,
        expectedTimeline: guidance.expectedTimeline,
        escalation: guidance.escalationProcess
    });
};

// ====================================================
// 5. MEETING SUMMARIZER INTEGRATION
// ====================================================

// Example: Update GramSabhaSummarizer.tsx component
const loadMeetings = async () => {
    try {
        setLoading(true);

        // Get all meetings
        const result = await janaiAPI.meeting.getAll({
            type: selectedType,    // 'Gram Sabha', 'Ward Meeting', etc.
            status: selectedStatus // 'Completed', 'Upcoming', 'Cancelled'
        });

        setMeetings(result.meetings);
        setLoading(false);

    } catch (error) {
        console.error('Load meetings error:', error);
    }
};

// Create new meeting
const createMeeting = async (meetingData) => {
    const meeting = await janaiAPI.meeting.create({
        title: meetingData.title,
        type: meetingData.type,
        date: meetingData.date,
        location: meetingData.location,
        status: 'Upcoming'
    });

    // Add to list
    setMeetings([meeting, ...meetings]);
};

// Summarize meeting from transcript
const handleSummarize = async (meetingId: string, transcript: string) => {
    try {
        setSummarizing(true);

        const updatedMeeting = await janaiAPI.meeting.summarize(
            meetingId,
            transcript
        );

        // Update UI with summary
        setSelectedMeeting({
            ...updatedMeeting,
            summary: updatedMeeting.summary,
            decisions: updatedMeeting.decisions,
            actionItems: updatedMeeting.actionItems
        });

        setSummarizing(false);

    } catch (error) {
        console.error('Summarization error:', error);
    }
};

// Generate agenda for upcoming meeting
const generateAgenda = async () => {
    const result = await janaiAPI.meeting.generateAgenda(
        'Gram Sabha',
        ['Water supply', 'Road repairs', 'School renovation']
    );

    setAgenda(result.agenda);
};

// Ask question about a meeting
const askMeetingQuestion = async (meetingId: string, question: string) => {
    const result = await janaiAPI.meeting.askQuestion(meetingId, question);
    setAnswer(result.answer);
};

// Get action items
const loadActionItems = async () => {
    const result = await janaiAPI.meeting.getActionItems({
        status: 'Pending'
    });

    setActionItems(result.actionItems);
};

// ====================================================
// HELPER FUNCTIONS
// ====================================================

// Read file content (for document upload)
const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

// ====================================================
// COMPLETE EXAMPLE: Civic Companion Component
// ====================================================

import { useState, useEffect } from 'react';
import janaiAPI from '@/utils/janaiAPI';

export function CivicCompanionChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(`session-${Date.now()}`);
    const [suggestions, setSuggestions] = useState([]);

    // Load suggestions on mount
    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const result = await janaiAPI.civicCompanion.getSuggestions(sessionId);
            setSuggestions(result.suggestions);
        } catch (error) {
            console.error('Load suggestions error:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message to UI
        const userMessage = { role: 'user', content: input, timestamp: Date.now() };
        setMessages([...messages, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Get AI response
            const response = await janaiAPI.civicCompanion.sendMessage(
                input,
                sessionId,
                'user-123' // Replace with actual user ID
            );

            // Add AI response to UI
            const aiMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);

            // Reload suggestions
            loadSuggestions();

        } catch (error) {
            console.error('Send message error:', error);
            alert('Failed to get response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            {/* Messages */}
            <div className="messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {loading && <div className="loading">AI is thinking...</div>}
            </div>

            {/* Suggestions */}
            <div className="suggestions">
                {suggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="suggestion-btn"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about government services..."
                />
                <button onClick={handleSend} disabled={loading}>
                    Send
                </button>
            </div>
        </div>
    );
}

// ====================================================
// NOTES
// ====================================================

/*
1. Replace 'user-123' with actual user ID from authentication
2. Handle errors appropriately with user-friendly messages
3. Add loading states for better UX
4. Store sessionId in component state or context
5. Clear session when user logs out
6. Add proper TypeScript types from janaiAPI.ts

The backend is READY and TESTED. 
Just import janaiAPI and start using these examples!
*/
