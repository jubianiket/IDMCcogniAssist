'use server';
/**
 * @fileOverview A Genkit flow for answering user questions about Informatica Data Management Cloud (IDMC).
 *
 * - idmcQuestionAnswering - A function that handles the IDMC question answering process.
 * - IDMCQuestionAnsweringInput - The input type for the idmcQuestionAnswering function.
 * - IDMCQuestionAnsweringOutput - The return type for the idmcQuestionAnswering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IDMCQuestionAnsweringInputSchema = z.object({
  question: z
    .string()
    .describe(
      'The user\'s question about Informatica Data Management Cloud (IDMC).'
    ),
});
export type IDMCQuestionAnsweringInput = z.infer<
  typeof IDMCQuestionAnsweringInputSchema
>;

const IDMCQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the IDMC question.'),
});
export type IDMCQuestionAnsweringOutput = z.infer<
  typeof IDMCQuestionAnsweringOutputSchema
>;

export async function idmcQuestionAnswering(
  input: IDMCQuestionAnsweringInput
): Promise<IDMCQuestionAnsweringOutput> {
  return idmcQuestionAnsweringFlow(input);
}

const idmcQuestionAnsweringPrompt = ai.definePrompt({
  name: 'idmcQuestionAnsweringPrompt',
  input: {schema: IDMCQuestionAnsweringInputSchema},
  output: {schema: IDMCQuestionAnsweringOutputSchema},
  prompt: `You are an expert assistant specialized in Informatica Data Management Cloud (IDMC). Your goal is to provide accurate, comprehensive, and relevant answers to user questions about IDMC.

Answer the following question about IDMC:
Question: {{{question}}}`,
});

const idmcQuestionAnsweringFlow = ai.defineFlow(
  {
    name: 'idmcQuestionAnsweringFlow',
    inputSchema: IDMCQuestionAnsweringInputSchema,
    outputSchema: IDMCQuestionAnsweringOutputSchema,
  },
  async input => {
    const {output} = await idmcQuestionAnsweringPrompt(input);
    return output!;
  }
);
