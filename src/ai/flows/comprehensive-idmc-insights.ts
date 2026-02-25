'use server';
/**
 * @fileOverview This file implements a Genkit flow for the IDMC CogniAssistant,
 * enabling comprehensive question answering about Informatica Data Management Cloud (IDMC).
 * It orchestrates multiple AI models and simulates dynamic knowledge retrieval to provide
 * well-rounded and accurate insights.
 *
 * - comprehensiveIDMCInsights - The main function to answer IDMC questions.
 * - ComprehensiveIDMCInsightsInput - The input type for the comprehensiveIDMCInsights function.
 * - ComprehensiveIDMCInsightsOutput - The return type for the comprehensiveIDMCInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the IDMC question
const ComprehensiveIDMCInsightsInputSchema = z.object({
  question: z.string().describe('The user\'s question about Informatica Data Management Cloud (IDMC).'),
});
export type ComprehensiveIDMCInsightsInput = z.infer<typeof ComprehensiveIDMCInsightsInputSchema>;

// Output schema for the comprehensive answer
const ComprehensiveIDMCInsightsOutputSchema = z.object({
  answer: z.string().describe('A comprehensive and synthesized answer to the IDMC question.'),
});
export type ComprehensiveIDMCInsightsOutput = z.infer<typeof ComprehensiveIDMCInsightsOutputSchema>;

// Placeholder tool for dynamic knowledge retrieval
// In a real application, this would integrate with a vector database,
// RAG system, or external IDMC documentation APIs.
const retrieveIDMCDocumentation = ai.defineTool(
  {
    name: 'retrieveIDMCDocumentation',
    description: 'Retrieves relevant information from extensive IDMC documentation and resources based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The search query for IDMC documentation.'),
    }),
    outputSchema: z.string().describe('The retrieved documentation snippets.'),
  },
  async (input) => {
    // Simulate documentation retrieval.
    // In a production system, this would call a real search service or RAG pipeline.
    const mockDocumentation = `
      Documentation for "${input.query}":

      If the query is about "data integration", here's some mock data:
      "Informatica Data Management Cloud (IDMC) offers robust data integration services, allowing users to connect to various data sources, transform data, and load it into target systems. Key features include cloud-native ETL, ELT, and replication capabilities, supporting both batch and real-time data movement. It also provides pre-built connectors for popular enterprise applications and databases."

      If the query is about "data governance", here's some mock data:
      "IDMC's data governance capabilities are provided through modules like Cloud Data Governance and Catalog (CDGC). CDGC helps organizations discover, classify, and catalog their data assets across hybrid and multi-cloud environments. It enables data stewardship, lineage tracking, and policy enforcement to ensure data quality, compliance, and trustworthiness."

      If the query is about "cloud data warehousing", here's some mock data:
      "IDMC supports integration with various cloud data warehouses like Snowflake, Amazon Redshift, Google BigQuery, and Azure Synapse Analytics. It optimizes data loading and transformation processes for these platforms, leveraging their native compute capabilities for high performance and scalability."

      For any other query, assume relevant documentation is found.
      "General documentation snippet relevant to ${input.query}: IDMC provides a unified platform for data integration, data governance, data quality, and master data management in the cloud, helping businesses unlock the value of their data assets with AI-powered capabilities and a microservices-based architecture."
    `;
    return mockDocumentation;
  }
);

// Prompt for a general overview using a faster model
const generalOverviewPrompt = ai.definePrompt({
  name: 'idmcGeneralOverviewPrompt',
  input: { schema: ComprehensiveIDMCInsightsInputSchema },
  output: { schema: z.string() }, // Output a string directly for this prompt
  prompt: `You are an AI assistant specializing in Informatica Data Management Cloud (IDMC).
Please provide a concise, high-level overview or initial answer to the following question about IDMC.
Be factual and directly address the core of the question without excessive detail.

Question: {{{question}}} `,
  config: {
    model: 'googleai/gemini-1.5-flash', // Use a faster model for initial overview
  },
});

// Prompt for deeper insights, potentially using the documentation retrieval tool
const detailedInsightsPrompt = ai.definePrompt({
  name: 'idmcDetailedInsightsPrompt',
  input: { schema: ComprehensiveIDMCInsightsInputSchema },
  output: { schema: z.string() }, // Output a string directly for this prompt
  tools: [retrieveIDMCDocumentation], // Make the documentation tool available
  prompt: `You are an expert AI assistant specializing in Informatica Data Management Cloud (IDMC).
Your goal is to provide a comprehensive and detailed answer to the user's question.
If necessary, use the 'retrieveIDMCDocumentation' tool to find relevant information from IDMC documentation to ground your answer.
After gathering information (if any), synthesize a thorough response.

Question: {{{question}}} `,
  config: {
    model: 'googleai/gemini-1.5-pro', // Use a more capable model for detailed analysis
  },
});

// Prompt to synthesize responses from multiple models
const synthesisPrompt = ai.definePrompt({
  name: 'idmcSynthesisPrompt',
  input: {
    schema: z.object({
      question: z.string(),
      overview: z.string(),
      detailed: z.string(),
    }),
  },
  output: { schema: ComprehensiveIDMCInsightsOutputSchema },
  prompt: `You are an advanced AI tasked with synthesizing information from different AI models to provide the most comprehensive answer to an IDMC question.
Below are two responses to the user's question: one general overview and one more detailed insight.
Combine these responses, resolving any inconsistencies, enhancing clarity, and ensuring all relevant aspects of the question are addressed.
Format the final answer clearly and professionally.

User's Question: {{{question}}}

General Overview:
{{{overview}}}

Detailed Insights:
{{{detailed}}}

Provide the synthesized, comprehensive answer:`,
  config: {
    model: 'googleai/gemini-1.5-pro', // Use a capable model for synthesis
  },
});

// The main Genkit flow
const comprehensiveIDMCInsightsFlow = ai.defineFlow(
  {
    name: 'comprehensiveIDMCInsightsFlow',
    inputSchema: ComprehensiveIDMCInsightsInputSchema,
    outputSchema: ComprehensiveIDMCInsightsOutputSchema,
  },
  async (input) => {
    // Step 1: Get a general overview from a faster model
    const overviewResponse = await generalOverviewPrompt(input);
    const overview = overviewResponse.output!;

    // Step 2: Get detailed insights from a more capable model, potentially using the documentation tool
    const detailedResponse = await detailedInsightsPrompt(input);
    const detailed = detailedResponse.output!;

    // Step 3: Synthesize the responses from both models
    const synthesizedResponse = await synthesisPrompt({
      question: input.question,
      overview: overview,
      detailed: detailed,
    });

    return synthesizedResponse.output!;
  }
);

export async function comprehensiveIDMCInsights(
  input: ComprehensiveIDMCInsightsInput
): Promise<ComprehensiveIDMCInsightsOutput> {
  return comprehensiveIDMCInsightsFlow(input);
}
