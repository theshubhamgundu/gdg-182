// ==========================
// Scheme Finder Service
// Government welfare schemes discovery
// ==========================

import { generateResponse, extractStructuredData } from './groqService';

export interface Scheme {
    name: string;
    description: string;
    eligibility: string[];
    benefits: string[];
    requiredDocuments: string[];
    applicationProcess: string;
    websiteLink?: string;
    department: string;
    schemeType: 'Central' | 'State' | 'Local';
    category: string;
}

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

/**
 * Find schemes based on user profile
 */
export async function findSchemes(profile: UserProfile): Promise<Scheme[]> {
    const profileDesc = Object.entries(profile)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');

    const prompt = `You are a government scheme expert for India. Find welfare schemes for a citizen with this profile:
${profileDesc}

IMPORTANT INSTRUCTIONS:
${profile.location?.state ? `
1. PRIORITIZE schemes specific to ${profile.location.state} state - these should be listed FIRST
${profile.location?.district ? `2. Include schemes specific to ${profile.location.district} district` : ''}
3. Only include 2-3 major relevant Central schemes that are universally applicable
4. Focus heavily on STATE-LEVEL and LOCAL schemes available in ${profile.location.state}
` : `
1. Focus on Central government schemes
2. Mention state-specific schemes where applicable
`}

List 6-10 schemes with clear priority to location-specific schemes:
- ${profile.location?.state ? `**${profile.location.state} state schemes (LIST THESE FIRST)${profile.location?.district ? ` and ${profile.location.district} district schemes` : ''}**` : 'State schemes'}
- Central government schemes (only major relevant ones)

For each scheme provide:
1. Name (mark if it's State/Central/Local scheme)
2. Brief description
3. Eligibility criteria
4. Key benefits
5. Required documents
6. How to apply
7. Official website if available


Focus on schemes the user is actually eligible for based on their profile.
Ensure location-specific schemes are mentioned first and most prominently.

**CRITICAL: Return ONLY a valid JSON array. No additional text or explanation.**

Return your response as a JSON array with this exact structure:
[
  {
    "name": "Scheme Name (State/Central/Local)",
    "description": "Brief 2-3 sentence description",
    "eligibility": ["Criterion 1", "Criterion 2"],
    "benefits": ["Benefit 1", "Benefit 2"],
    "requiredDocuments": ["Document 1", "Document 2"],
    "applicationProcess": "Step-by-step process or website link",
    "websiteLink": "Official URL if available",
    "department": "Department name",
    "schemeType": "State" or "Central" or "Local",
    "category": "Category name"
  }
]`;

    const response = await generateResponse(
        prompt,
        'scheme_finder',
        [],
        { max_tokens: 2048, temperature: 0.3 }
    );

    // Parse response - try JSON first, then fall back to text parsing
    let cleanedResponse = '';
    try {
        // Remove markdown code blocks if present
        cleanedResponse = response.trim();

        // Remove ```json and ``` if present
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
        }
        if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
        }
        if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
        }

        cleanedResponse = cleanedResponse.trim();

        // Try to parse as JSON first
        const schemes = JSON.parse(cleanedResponse);

        if (!Array.isArray(schemes) || schemes.length === 0) {
            throw new Error('Response is not an array or is empty - will try text parsing');
        }

        //Validate and clean each scheme
        const validSchemes = schemes.map((scheme: any) => ({
            name: scheme.name || 'Unknown Scheme',
            description: scheme.description || 'No description available',
            eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility : [scheme.eligibility || 'Not specified'],
            benefits: Array.isArray(scheme.benefits) ? scheme.benefits : [scheme.benefits || 'Not specified'],
            requiredDocuments: Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : [scheme.requiredDocuments || 'Not specified'],
            applicationProcess: scheme.applicationProcess || scheme.websiteLink || 'Contact local government office',
            websiteLink: scheme.websiteLink || '',
            department: scheme.department || 'Government of India',
            schemeType: scheme.schemeType || 'Central',
            category: scheme.category || 'General'
        }));

        console.log(`✅ Successfully parsed ${validSchemes.length} schemes from JSON`);
        return validSchemes;
    } catch (jsonError) {
        console.log('ℹ️  JSON parsing failed, trying text parsing...');

        // Fall back to text parsing
        try {
            const schemes: Scheme[] = [];

            // Split by common separators for schemes
            const schemeBlocks = response.split(/\n\n+|(?=\*\*Scheme \d+:)|(?=\d+\.\s+\*\*)/);

            for (const block of schemeBlocks) {
                if (block.trim().length < 50) continue; // Skip tiny blocks

                const scheme: any = {
                    name: '',
                    description: '',
                    eligibility: [],
                    benefits: [],
                    requiredDocuments: [],
                    applicationProcess: '',
                    websiteLink: '',
                    department: '',
                    schemeType: 'Central',
                    category: 'General'
                };

                // Extract name (usually first line or after "Scheme:" or numbered)
                const nameMatch = block.match(/(?:\*\*|##\s*)(.+?)(?:\*\*|\n|:)/);
                if (nameMatch) {
                    scheme.name = nameMatch[1].trim().replace(/^\d+\.\s*/, '');

                    // Detect scheme type from name
                    if (scheme.name.toLowerCase().includes('state') ||
                        profile.location?.state && scheme.name.toLowerCase().includes(profile.location.state.toLowerCase())) {
                        scheme.schemeType = 'State';
                    }
                }

                // Extract description
                const descMatch = block.match(/(?:Description|Brief)[:\s]+(.+?)(?=\n(?:Eligibility|Benefits|\*\*|$))/is);
                if (descMatch) {
                    scheme.description = descMatch[1].trim();
                } else {
                    // Use first paragraph as description
                    const lines = block.split('\n');
                    scheme.description = lines.slice(1, 3).join(' ').trim();
                }

                // Extract eligibility
                const eligMatch = block.match(/(?:Eligibility)[:\s]+(.+?)(?=\n(?:Benefits|Required|Application|\*\*|$))/is);
                if (eligMatch) {
                    scheme.eligibility = eligMatch[1].split(/[;\n•\-]/).map(e => e.trim()).filter(e => e);
                }

                // Extract benefits
                const benefitsMatch = block.match(/(?:Benefits|Key benefits)[:\s]+(.+?)(?=\n(?:Required|Eligibility|Application|\*\*|$))/is);
                if (benefitsMatch) {
                    scheme.benefits = benefitsMatch[1].split(/[;\n•\-]/).map(b => b.trim()).filter(b => b);
                }

                // Extract required documents
                const docsMatch = block.match(/(?:Required documents|Documents)[:\s]+(.+?)(?=\n(?:Application|How to|\*\*|$))/is);
                if (docsMatch) {
                    scheme.requiredDocuments = docsMatch[1].split(/[;\n•\-,]/).map(d => d.trim()).filter(d => d);
                }

                // Extract application process/website
                const appMatch = block.match(/(?:Application|How to apply|Website)[:\s]+(.+)$/is);
                if (appMatch) {
                    scheme.applicationProcess = appMatch[1].trim();
                }

                // Extract website link
                const urlMatch = block.match(/(https?:\/\/[^\s\)]+)/);
                if (urlMatch) {
                    scheme.websiteLink = urlMatch[1];
                }

                // Only add if we got a name
                if (scheme.name) {
                    schemes.push(scheme);
                }
            }

            if (schemes.length > 0) {
                console.log(`✅ Successfully parsed ${schemes.length} schemes from text`);
                return schemes;
            }

            throw new Error('Could not parse any schemes from text');

        } catch (textError) {
            console.error('❌ Both JSON and text parsing failed');
            console.error('📄 Raw response (first 500):', response.substring(0, 500));

            // Final fallback
            return [{
                name: 'Government Schemes Information',
                description: response,
                eligibility: [],
                benefits: [],
                requiredDocuments: [],
                applicationProcess: 'Please visit your nearest government office for more details.',
                department: 'Various',
                schemeType: 'Central',
                category: 'General'
            }];
        }
    }
}

/**
 * Get detailed information about a specific scheme
 */
export async function getSchemeDetails(schemeName: string): Promise<Scheme> {
    const prompt = `Provide detailed information about the "${schemeName}" government scheme in India.

Include:
1. Full scheme name
2. Detailed description (100-150 words)
3. Complete eligibility criteria
4. All benefits
5. Required documents list
6. Step-by-step application process
7. Official website (if known)
8. Implementing department
9. Scheme type (Central/State/Local)
10. Category (Agriculture, Education, Health, etc.)

Provide accurate, up-to-date information.`;

    const response = await generateResponse(
        prompt,
        'scheme_finder',
        [],
        { max_tokens: 1024 }
    );

    const schema = `{
  "name": "string",
  "description": "string",
  "eligibility": ["string"],
  "benefits": ["string"],
  "requiredDocuments": ["string"],
  "applicationProcess": "string",
  "websiteLink": "string or empty",
  "department": "string",
  "schemeType": "Central | State | Local",
  "category": "string"
}`;

    try {
        return await extractStructuredData(response, schema, `Extract from:\n${response}`);
    } catch (error) {
        return {
            name: schemeName,
            description: response,
            eligibility: [],
            benefits: [],
            requiredDocuments: [],
            applicationProcess: '',
            department: 'Government of India',
            schemeType: 'Central',
            category: 'General'
        };
    }
}

/**
 * Compare multiple schemes
 */
export async function compareSchemes(schemeNames: string[]): Promise<{
    comparison: string;
    recommendation: string;
    schemes: Partial<Scheme>[];
}> {
    const prompt = `Compare these government schemes in India:
${schemeNames.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Provide:
1. Side-by-side comparison of key features
2. Eligibility differences
3. Benefits comparison
4. Which scheme is better for different situations
5. Recommendation for typical users

Make it easy to understand which scheme to choose.`;

    const response = await generateResponse(
        prompt,
        'scheme_finder',
        [],
        { max_tokens: 1536 }
    );

    return {
        comparison: response,
        recommendation: response,
        schemes: []
    };
}

/**
 * Check eligibility for a scheme
 */
export async function checkEligibility(
    schemeName: string,
    profile: UserProfile
): Promise<{
    eligible: boolean;
    reasons: string[];
    missingCriteria: string[];
    suggestions: string[];
}> {
    const profileDesc = Object.entries(profile)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');

    const prompt = `Check if this user is eligible for the "${schemeName}" scheme:

User Profile: ${profileDesc}

Provide:
1. Eligible: Yes/No
2. Reasons why they are/aren't eligible
3. What criteria they don't meet (if not eligible)
4. Suggestions to become eligible (if not currently eligible)

Be specific and helpful.`;

    const response = await generateResponse(
        prompt,
        'scheme_finder',
        [],
        { temperature: 0.3, max_tokens: 512 }
    );

    const schema = `{
  "eligible": boolean,
  "reasons": ["string"],
  "missingCriteria": ["string"],
  "suggestions": ["string"]
}`;

    try {
        return await extractStructuredData(response, schema, `Extract from:\n${response}`);
    } catch (error) {
        return {
            eligible: false,
            reasons: [response],
            missingCriteria: [],
            suggestions: []
        };
    }
}

/**
 * Get schemes by category
 */
export async function getSchemesByCategory(
    category: string,
    state?: string
): Promise<Scheme[]> {
    const prompt = `List government schemes in the "${category}" category${state ? ` for ${state} state` : ''} in India.

Provide 5-8 popular and beneficial schemes with:
- Scheme name
- Description
- Key benefits
- Basic eligibility
- How to apply

Focus on currently active and accessible schemes.`;

    const response = await generateResponse(
        prompt,
        'scheme_finder',
        [],
        { max_tokens: 2048 }
    );

    const schema = `[{
  "name": "string",
  "description": "string",
  "eligibility": ["string"],
  "benefits": ["string"],
  "requiredDocuments": ["string"],
  "applicationProcess": "string",
  "department": "string",
  "schemeType": "Central | State | Local",
  "category": "string"
}]`;

    try {
        const schemes = await extractStructuredData(response, schema, `Extract from:\n${response}`);
        return Array.isArray(schemes) ? schemes : [];
    } catch (error) {
        return [];
    }
}

export default {
    findSchemes,
    getSchemeDetails,
    compareSchemes,
    checkEligibility,
    getSchemesByCategory
};
