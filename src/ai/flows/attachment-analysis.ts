'use server';
/**
 * @fileOverview A Genkit flow for answering user questions about Informatica Data Management Cloud (IDMC)
 * using provided attachments (images or documents) as context.
 *
 * - idmcAttachmentAnalysis - A function that handles the IDMC attachment analysis process.
 * - IDMCAttachmentAnalysisInput - The input type for the idmcAttachmentAnalysis function.
 * - IDMCAttachmentAnalysisOutput - The return type for the idmcAttachmentAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IDMCAttachmentAnalysisInputSchema = z.object({
  question: z.string().describe('The user\'s question about Informatica Data Management Cloud (IDMC).'),
  attachmentDataUri: z.string().describe('The attachment (image or PDF) as a data URI.'),
  attachmentType: z.string().optional().describe('The MIME type of the attachment.'),
});
export type IDMCAttachmentAnalysisInput = z.infer<typeof IDMCAttachmentAnalysisInputSchema>;

const IDMCAttachmentAnalysisOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer based on the question and the attachment.'),
});
export type IDMCAttachmentAnalysisOutput = z.infer<typeof IDMCAttachmentAnalysisOutputSchema>;

const attachmentPrompt = ai.definePrompt({
  name: 'idmcAttachmentAnalysisPrompt',
  input: { schema: IDMCAttachmentAnalysisInputSchema },
  output: { schema: IDMCAttachmentAnalysisOutputSchema },
  prompt: `You are an expert on Informatica Data Management Cloud (IDMC).
The user has provided an attachment (image or document) and a question.

Your task is to:
1. Analyze the content of the attached media.
2. Answer the user's question accurately using both your general IDMC knowledge and the specific details found in the attachment.
3. If the attachment is an architectural diagram, explain the components shown.
4. If it's a screenshot of an error, provide troubleshooting steps based on IDMC best practices.

Question: {{{question}}}
Attachment: {{media url=attachmentDataUri}}`,
});

const idmcAttachmentAnalysisFlow = ai.defineFlow(
  {
    name: 'idmcAttachmentAnalysisFlow',
    inputSchema: IDMCAttachmentAnalysisInputSchema,
    outputSchema: IDMCAttachmentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await attachmentPrompt(input);
    return output!;
  }
);

/**
 * Analyzes an IDMC-related attachment and answers a user question.
 * @param input - The question and attachment data.
 * @returns The AI's comprehensive response.
 */
export async function idmcAttachmentAnalysis(
  input: IDMCAttachmentAnalysisInput
): Promise<IDMCAttachmentAnalysisOutput> {
  return idmcAttachmentAnalysisFlow(input);
}
