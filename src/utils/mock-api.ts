
// Mock user data and storage keys
const STORAGE_KEYS = {
    SESSION: 'janai_session',
    DOCUMENTS: 'janai_documents',
    FAMILY: 'janai_family',
    USER_DATA: 'janai_user_info'
};

// Helper to get from localStorage
const getLocal = (key: string, defaultValue: any = null) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

// Helper to set to localStorage
const setLocal = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const mockAuth = {
    async getSession() {
        const session = getLocal(STORAGE_KEYS.SESSION);
        return { data: { session }, error: null };
    },

    async signInWithPassword({ email, password }: any) {
        // Basic mock auth - in a real app you'd verify password
        const user = {
            id: 'mock-user-123',
            email,
            user_metadata: { name: email.split('@')[0] }
        };
        const session = {
            access_token: 'mock-token-' + Date.now(),
            user
        };
        setLocal(STORAGE_KEYS.SESSION, session);
        return { data: session, error: null };
    },

    async signUp({ email, password, options }: any) {
        const user = {
            id: 'mock-user-' + Date.now(),
            email,
            user_metadata: options?.data || {}
        };
        return { data: { user }, error: null };
    },

    async signOut() {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return { error: null };
    },

    async getUser(token?: string) {
        const session = getLocal(STORAGE_KEYS.SESSION);
        if (session) {
            return { data: { user: session.user }, error: null };
        }
        return { data: { user: null }, error: null };
    }
};

export const mockSupabase = {
    auth: mockAuth,
    from: (table: string) => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: null }),
                order: () => ({ data: [], error: null }),
                then: (cb: any) => cb({ data: [], error: null })
            }),
            order: () => ({ data: [], error: null }),
            then: (cb: any) => cb({ data: [], error: null })
        }),
        insert: (data: any) => ({
            select: () => ({
                single: async () => ({ data, error: null })
            })
        }),
        update: (data: any) => ({
            eq: () => ({
                select: () => ({
                    single: async () => ({ data, error: null })
                })
            })
        }),
        delete: () => ({
            eq: () => ({ data: {}, error: null })
        })
    })
};

// Mock API responses for the fetch calls
export const mockApiFetch = async (url: string, options: any = {}) => {
    const path = url.split('/v1/')[1] || url;
    console.log('Mock API Call:', path, options);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (path.includes('signup')) {
        const body = JSON.parse(options.body);
        return {
            ok: true,
            json: async () => ({ user: { id: 'mock-user-123', email: body.email }, message: 'Signup successful' })
        };
    }

    if (path.includes('documents/all')) {
        const docs = getLocal(STORAGE_KEYS.DOCUMENTS, []);
        return {
            ok: true,
            json: async () => ({ ownDocuments: docs, sharedDocuments: [] })
        };
    }

    if (path.includes('documents/upload')) {
        const body = options.body; // FormData
        const name = body.get('name');
        const type = body.get('type');
        const newDoc = {
            id: 'doc-' + Date.now(),
            name,
            type,
            fileName: name + '.pdf',
            url: 'https://via.placeholder.com/150',
            uploadedAt: new Date().toISOString(),
            size: 1024 * 500
        };
        const docs = getLocal(STORAGE_KEYS.DOCUMENTS, []);
        setLocal(STORAGE_KEYS.DOCUMENTS, [...docs, newDoc]);
        return {
            ok: true,
            json: async () => ({ document: newDoc })
        };
    }

    if (path.includes('family')) {
        const members = getLocal(STORAGE_KEYS.FAMILY, []);
        return {
            ok: true,
            json: async () => ({ familyMembers: members })
        };
    }

    if (path.includes('meetings')) {
        const meetings = getLocal('janai_meetings', [
            {
                id: 'meet-1',
                title: 'Monthly Gram Sabha - June 2024',
                type: 'Gram Sabha',
                date: '2024-06-15',
                location: 'Village Panchayat Hall',
                status: 'Completed',
                summary: 'Discussion on new water tank construction and road repairs in North Ward. Approved ₹5 Lakh budget for primary school painting. Community raised concerns about street lighting.',
                decisions: [
                    'New water tank construction approved - ₹3L budget allocated',
                    'Road repairs in Ward 2 prioritized for monsoon season',
                    'School maintenance budget cleared - Work to start in July',
                    'Street lighting survey to be conducted next week'
                ],
                attendees: 45,
                budget: '₹8.5L'
            },
            {
                id: 'meet-2',
                title: 'Ward 7 Community Meeting - June 2024',
                type: 'Ward Meeting',
                date: '2024-06-20',
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
            },
            {
                id: 'meet-3',
                title: 'Municipal Council Meeting - July 2024',
                type: 'Municipal Council',
                date: '2024-07-05',
                location: 'City Municipal Corporation Hall',
                status: 'Upcoming',
                summary: 'Quarterly review of city infrastructure projects, budget allocations for public transport, and discussion on smart city initiatives.',
                decisions: [],
                attendees: 0,
                budget: '₹150L'
            },
            {
                id: 'meet-4',
                title: 'Special Agriculture Subsidy Meeting',
                type: 'Panchayat',
                date: '2024-06-25',
                location: 'Panchayat Bhavan',
                status: 'Completed',
                summary: 'Distribution of seeds for Kharif season and organic farming workshop planning. Farmers were briefed on new government subsidy schemes.',
                decisions: [
                    'Seed distribution schedule finalized - 30th June to 5th July',
                    'Organic farming workshop planned for 15th July',
                    'Fertilizer subsidy applications to be accepted till 10th July'
                ],
                attendees: 62,
                budget: '₹6L'
            }
        ]);
        return {
            ok: true,
            json: async () => ({ meetings })
        };
    }

    if (path.includes('family/add')) {
        const body = JSON.parse(options.body);
        const newMember = {
            ...body,
            id: 'mem-' + Date.now(),
            addedAt: new Date().toISOString()
        };
        const members = getLocal(STORAGE_KEYS.FAMILY, []);
        setLocal(STORAGE_KEYS.FAMILY, [...members, newMember]);
        return {
            ok: true,
            json: async () => ({ member: newMember })
        };
    }

    if (path.includes('complaints')) {
        if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const newComplaint = {
                ...body,
                id: 'comp-' + Date.now(),
                status: 'Submitted',
                department: 'General Administration',
                submittedAt: new Date().toISOString()
            };
            const complaints = getLocal('janai_complaints', []);
            setLocal('janai_complaints', [newComplaint, ...complaints]);
            return {
                ok: true,
                json: async () => ({ complaint: newComplaint })
            };
        }
        const complaints = getLocal('janai_complaints', []);
        return {
            ok: true,
            json: async () => ({ complaints })
        };
    }

    if (path.includes('user/profile')) {
        const userData = getLocal(STORAGE_KEYS.USER_DATA, {
            name: 'Sample User',
            email: 'user@example.com',
            age: '25',
            occupation: 'Student',
            income: '300000'
        });
        return {
            ok: true,
            json: async () => ({ profile: userData })
        };
    }

    // Fallback for other routes
    return {
        ok: true,
        json: async () => ({ success: true, error: null } as any)
    };
};
