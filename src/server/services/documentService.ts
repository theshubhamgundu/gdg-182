// ==========================
// Document Service
// Document simplification and analysis
// ==========================

import { generateResponse, extractStructuredData } from './groqService';

export interface DocumentAnalysis {
    documentType: string;
    summary: string;
    keyPoints: string[];
    requiredActions: string[];
    deadlines: Array<{ description: string; date: string }>;
    simplifiedText: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Analyze and simplify a document
 */
export async function analyzeDocument(
    documentText: string,
    documentName?: string
): Promise<DocumentAnalysis> {
    const prompt = `Analyze this ${documentName ? `"${documentName}"` : 'document'} and provide:
1. Document type (e.g., "Government Form", "Policy Document", "Notice", etc.)
2. Brief summary (2-3 sentences)
3. Key points (3-5 bullet points)
4. Required actions if any
5. Important deadlines if mentioned
6. Simplified explanation in plain language

Document text:
${documentText}

Provide a comprehensive but concise analysis that helps a common citizen understand this document easily.`;

    const response = await generateResponse(
        prompt,
        'document_simplifier',
        [],
        { max_tokens: 1024 }
    );

    // Try to extract structured data
    const schema = `{
  "documentType": "string",
  "summary": "string",
  "keyPoints": ["string"],
  "requiredActions": ["string"],
  "deadlines": [{"description": "string", "date": "string"}],
  "simplifiedText": "string",
  "complexity": "simple | moderate | complex"
}`;

    const instructions = `Extract document analysis from the following text. If any field is not found, use empty array/string.

Analysis text:
${response}`;

    try {
        const structured = await extractStructuredData(response, schema, instructions);
        return structured as DocumentAnalysis;
    } catch (error) {
        // Fallback to parsed response
        return {
            documentType: 'Document',
            summary: response,
            keyPoints: [],
            requiredActions: [],
            deadlines: [],
            simplifiedText: response,
            complexity: 'moderate'
        };
    }
}

/**
 * Extract specific information from document
 */
export async function extractInformation(
    documentText: string,
    query: string
): Promise<string> {
    const prompt = `From the following document, answer this question: "${query}"

Document:
${documentText}

Provide a clear, concise answer based only on the information in the document. If the information is not found, say so.`;

    return generateResponse(
        prompt,
        'document_simplifier',
        [],
        { temperature: 0.3 } // Lower temperature for factual extraction
    );
}

/**
 * Translate document to simpler language
 */
export async function simplifyDocument(
    documentText: string,
    targetAudience: 'child' | 'senior' | 'general' = 'general'
): Promise<string> {
    const audienceGuide = {
        child: 'Explain like I\'m 10 years old',
        senior: 'Explain in very simple terms for senior citizens who may not be tech-savvy',
        general: 'Explain in simple language anyone can understand'
    };

    const prompt = `${audienceGuide[targetAudience]}.

Simplify this government document:
${documentText}

Make it easy to understand while keeping all important information.`;

    return generateResponse(
        prompt,
        'document_simplifier',
        [],
        { max_tokens: 1024 }
    );
}

/**
 * Compare two documents
 */
export async function compareDocuments(
    document1: string,
    document2: string,
    document1Name?: string,
    document2Name?: string
): Promise<{
    similarities: string[];
    differences: string[];
    recommendation: string;
}> {
    const name1 = document1Name || 'Document 1';
    const name2 = document2Name || 'Document 2';

    const prompt = `Compare these two documents and provide:
1. Key similarities
2. Key differences  
3. Which is better and why (if applicable)

${name1}:
${document1}

${name2}:
${document2}

Provide a practical comparison that helps someone decide between them.`;

    const response = await generateResponse(
        prompt,
        'document_simplifier',
        [],
        { max_tokens: 800 }
    );

    const schema = `{
  "similarities": ["string"],
  "differences": ["string"],
  "recommendation": "string"
}`;

    const instructions = `Extract comparison from this text:
${response}`;

    try {
        return await extractStructuredData(response, schema, instructions);
    } catch (error) {
        return {
            similarities: [],
            differences: [],
            recommendation: response
        };
    }
}

export default {
    analyzeDocument,
    extractInformation,
    simplifyDocument,
    compareDocuments
};
