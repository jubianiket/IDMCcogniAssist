
'use server';
/**
 * @fileOverview A Genkit flow for answering user questions about Informatica Data Management Cloud (IDMC)
 * using provided attachments (images, PDFs, Word, or Excel) as context.
 *
 * - idmcAttachmentAnalysis - A function that handles the IDMC attachment analysis process.
 * - IDMCAttachmentAnalysisInput - The input type for the idmcAttachmentAnalysis function.
 * - IDMCAttachmentAnalysisOutput - The return type for the idmcAttachmentAnalysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

const IDMCAttachmentAnalysisInputSchema = z.object({
  question: z.string().describe('The user\'s question about Informatica Data Management Cloud (IDMC).'),
  attachmentDataUri: z.string().describe('The attachment as a data URI.'),
  attachmentType: z.string().optional().describe('The MIME type of the attachment.'),
});
export type IDMCAttachmentAnalysisInput = z.infer<typeof IDMCAttachmentAnalysisInputSchema>;

const IDMCAttachmentAnalysisOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer based on the question and the attachment content.'),
});
export type IDMCAttachmentAnalysisOutput = z.infer<typeof IDMCAttachmentAnalysisOutputSchema>;

const attachmentPrompt = ai.definePrompt({
  name: 'idmcAttachmentAnalysisPrompt',
  input: {
    schema: z.object({
      question: z.string(),
      attachmentDataUri: z.string().optional(),
      extractedText: z.string().optional(),
      isMediaSupported: z.boolean(),
    }),
  },
  output: { schema: IDMCAttachmentAnalysisOutputSchema },
  prompt: `You are an expert on Informatica Data Management Cloud (IDMC).
The user has provided an attachment and a question.

Your task is to:
1. Analyze the content of the attached file.
2. Answer the user's question accurately using both your general IDMC knowledge and the specific details found in the attachment.

{{#if extractedText}}
EXTRACTED CONTENT FROM DOCUMENT:
{{{extractedText}}}
{{/if}}

{{#if isMediaSupported}}
MEDIA ATTACHMENT: {{media url=attachmentDataUri}}
{{/if}}

Question: {{{question}}}`,
});

/**
 * Parses base64 data URI and extracts text for Office documents.
 */
async function extractTextFromOffice(dataUri: string, mimeType: string): Promise<string> {
  const base64Data = dataUri.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    if (mimeType.includes('officedocument.wordprocessingml.document') || mimeType.includes('msword')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimeType.includes('officedocument.spreadsheetml.sheet') || mimeType.includes('ms-excel')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach((sheetName) => {
        text += `\nSheet: ${sheetName}\n`;
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_csv(sheet);
      });
      return text;
    }
  } catch (error) {
    console.error('Error extracting text from office document:', error);
    return 'Error: Could not extract text from this document.';
  }
  return '';
}

const idmcAttachmentAnalysisFlow = ai.defineFlow(
  {
    name: 'idmcAttachmentAnalysisFlow',
    inputSchema: IDMCAttachmentAnalysisInputSchema,
    outputSchema: IDMCAttachmentAnalysisOutputSchema,
  },
  async (input) => {
    const mimeType = input.attachmentType || '';
    const isImageOrPdf = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    
    let extractedText = '';
    let isMediaSupported = isImageOrPdf;

    // For Office files, extract text manually as Gemini data URIs only support Image, Video, Audio, and PDF
    if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('text/plain')) {
      if (mimeType === 'text/plain') {
        extractedText = Buffer.from(input.attachmentDataUri.split(',')[1], 'base64').toString('utf-8');
      } else {
        extractedText = await extractTextFromOffice(input.attachmentDataUri, mimeType);
      }
    }

    const { output } = await attachmentPrompt({
      question: input.question,
      attachmentDataUri: isMediaSupported ? input.attachmentDataUri : undefined,
      extractedText: extractedText || undefined,
      isMediaSupported,
    });
    
    return output!;
  }
);

export async function idmcAttachmentAnalysis(
  input: IDMCAttachmentAnalysisInput
): Promise<IDMCAttachmentAnalysisOutput> {
  return idmcAttachmentAnalysisFlow(input);
}
