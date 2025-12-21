// ==========================
// Backend API Test Script
// Run this to test all features
// ==========================

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPI(endpoint, options = {}, description = '') {
    console.log(`\n🧪 Testing: ${description || endpoint}`);
    console.log(`📡 ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success!');
            console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
            return { success: true, data };
        } else {
            console.log('❌ Failed:', response.status);
            console.log('Error:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   JanAI Backend API Test Suite        ║');
    console.log('╚════════════════════════════════════════╝');

    // Test 1: Civic Companion Chat
    await testAPI(
        '/companion/chat',
        {
            method: 'POST',
            body: JSON.stringify({
                message: 'What is PM-KISAN scheme?',
                sessionId: 'test-session-1',
                userId: 'test-user-1'
            })
        },
        'Civic Companion - Chat'
    );

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Get Suggested Questions
    await testAPI(
        '/companion/suggestions/test-session-1',
        {},
        'Civic Companion - Get Suggestions'
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Document Analysis
    await testAPI(
        '/documents/analyze',
        {
            method: 'POST',
            body: JSON.stringify({
                documentText: 'This is to inform all residents that the water supply will be suspended on December 25th from 9 AM to 5 PM for maintenance work. Please store sufficient water beforehand. Contact PWD office for queries.',
                documentName: 'Water Supply Notice'
            })
        },
        'Document Service - Analyze'
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Find Schemes
    await testAPI(
        '/schemes/find',
        {
            method: 'POST',
            body: JSON.stringify({
                age: 65,
                location: { state: 'Maharashtra' },
                income: 200000,
                occupation: 'Farmer'
            })
        },
        'Scheme Finder - Find Schemes'
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Submit Complaint
    await testAPI(
        '/complaints',
        {
            method: 'POST',
            body: JSON.stringify({
                userId: 'test-user-1',
                type: 'Road Repair',
                description: 'Large pothole causing accidents on Main Street near the market',
                location: 'Main Street, Ward 5, Near Central Market'
            })
        },
        'Complaint Service - Submit'
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Get All Meetings
    await testAPI(
        '/meetings',
        {},
        'Meeting Service - Get All Meetings'
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: Generate Meeting Agenda
    await testAPI(
        '/meetings/agenda/generate',
        {
            method: 'POST',
            body: JSON.stringify({
                meetingType: 'Gram Sabha',
                topics: ['Water supply', 'Road repairs', 'School maintenance']
            })
        },
        'Meeting Service - Generate Agenda'
    );

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Test Suite Complete!                 ║');
    console.log('╚════════════════════════════════════════╝\n');
}

// Run tests
runTests().catch(console.error);
