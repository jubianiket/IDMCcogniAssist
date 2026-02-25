'use server';
/**
 * @fileOverview This file implements a Genkit flow that provides answers to IDMC-related questions.
 * The answers are grounded in retrieved documentation to ensure factual accuracy and relevance.
 *
 * - contextualIDMCAnswers - An exported function that orchestrates the documentation retrieval and answer generation.
 * - ContextualIDMCAnswersInput - The input type for the contextualIDMCAnswers function.
 * - ContextualIDMCAnswersOutput - The return type for the contextualIDMCAnswers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualIDMCAnswersInputSchema = z.object({
  question: z.string().describe('The user\'s question about Informatica Data Management Cloud (IDMC).'),
});
export type ContextualIDMCAnswersInput = z.infer<typeof ContextualIDMCAnswersInputSchema>;

const ContextualIDMCAnswersOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question, grounded in IDMC documentation.'),
  sourceLinks: z.array(z.string()).optional().describe('Optional links to the official IDMC documentation sources used.'),
});
export type ContextualIDMCAnswersOutput = z.infer<typeof ContextualIDMCAnswersOutputSchema>;

// Define a tool to simulate retrieving IDMC documentation.
// In a real application, this would integrate with a vector database
// or a search service indexing official IDMC documentation.
const getDocumentationTool = ai.defineTool(
  {
    name: 'getDocumentation',
    description: 'Retrieves relevant IDMC documentation snippets and source links based on a user\'s question to help answer it truthfully.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or keywords for documentation search.'),
    }),
    outputSchema: z.object({
      documentation: z.string().describe('The retrieved IDMC documentation snippets.'),
      links: z.array(z.string()).describe('URLs to the official IDMC documentation sources.'),
    }),
  },
  async (input) => {
    // This is a mocked implementation. In a real scenario, this would
    // perform a search against actual IDMC documentation.
    console.log(`Simulating documentation retrieval for query: "${input.query}"`);
    // Placeholder documentation
    const mockDocumentation = `Informatica Data Management Cloud (IDMC) is a comprehensive, cloud-native, end-to-end data management platform. It offers various services including Data Integration, Data Quality, Master Data Management (MDM), Data Catalog, and Data Governance. IDMC is designed to help organizations manage, govern, and derive insights from their data across various cloud and on-premises environments. Key features include AI-powered automation (CLAIRE AI), metadata-driven data management, and a unified platform for all data initiatives. It supports multi-cloud and hybrid environments, ensuring flexibility and scalability for modern data ecosystems.`;

    const mockLinks = [
      'https://www.informatica.com/products/data-management-cloud.html',
      'https://docs.informatica.com/cloud-common-services/cloud-data-integration/current-version/getting-started/getting-started/informatica-intelligent-cloud-services--iics--overview.html',
    ];

    return {
      documentation: mockDocumentation,
      links: mockLinks,
    };
  }
);

// Define the prompt for the AI to generate an answer based on provided context.
const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: { schema: z.object({ question: z.string(), context: z.string() }) },
  output: { schema: z.object({ answer: z.string() }) }, // The source links will be handled by the flow directly.
  prompt: `You are an expert on Informatica Data Management Cloud (IDMC). Your task is to answer the user's question accurately and concisely.

Critically, you must answer the question based ONLY on the provided CONTEXT. Do not use any outside knowledge.
If the answer cannot be found within the provided CONTEXT, you must explicitly state: "I don't have enough information from the provided documentation to answer this question." Do not attempt to guess or infer.

Question: {{{question}}}

CONTEXT:
{{{context}}}`,
});

// Define the main Genkit flow for contextual IDMC answers.
const contextualIDMCAnswersFlow = ai.defineFlow(
  {
    name: 'contextualIDMCAnswersFlow',
    inputSchema: ContextualIDMCAnswersInputSchema,
    outputSchema: ContextualIDMCAnswersOutputSchema,
  },
  async (input) => {
    // Step 1: Retrieve relevant documentation using the defined tool.
    const { documentation, links } = await getDocumentationTool.run({
      query: input.question,
    });

    // Step 2: Use the retrieved documentation and the user's question to generate an answer.
    const { output } = await answerQuestionPrompt({
      question: input.question,
      context: documentation,
    });

    // Return the generated answer along with the source links.
    return {
      answer: output!.answer,
      sourceLinks: links,
    };
  }
);

/**
 * Provides an AI-generated answer to an IDMC-related question, grounded in official documentation.
 * @param input - An object containing the user's question.
 * @returns An object containing the AI's answer and optional links to source documentation.
 */
export async function contextualIDMCAnswers(
  input: ContextualIDMCAnswersInput
): Promise<ContextualIDMCAnswersOutput> {
  return contextualIDMCAnswersFlow(input);
}
