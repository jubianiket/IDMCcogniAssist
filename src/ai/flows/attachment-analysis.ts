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
EXTRACTED CONTENT FROM DOCUMENT (Word/Excel/Text):
--- START OF CONTENT ---
{{{extractedText}}}
--- END OF CONTENT ---
{{/if}}

{{#if isMediaSupported}}
MEDIA ATTACHMENT (Image/PDF): {{media url=attachmentDataUri}}
{{/if}}

Question: {{{question}}}`,
});

/**
 * Parses base64 data URI and extracts text for Office documents.
 */
async function extractTextFromOffice(dataUri: string, mimeType: string): Promise<string> {
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) return 'Error: Invalid file data.';
  
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    // Word Documents (.docx)
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('officedocument.word')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'The Word document appears to be empty.';
    } 
    
    // Excel Spreadsheets (.xlsx, .xls, .csv)
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('excel') ||
      mimeType === 'text/csv'
    ) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach((sheetName) => {
        text += `\n[Sheet: ${sheetName}]\n`;
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_csv(sheet);
      });
      return text || 'The spreadsheet appears to be empty.';
    }

    // Fallback for .doc (Mammoth doesn't support .doc, only .docx)
    if (mimeType === 'application/msword') {
      return 'Notice: This appears to be an older .doc format. Please convert it to .docx for full text extraction support.';
    }

  } catch (error) {
    console.error('Error extracting text from office document:', error);
    return `Error: Could not extract text from this ${mimeType} document.`;
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
    
    // Gemini supports Images and PDFs directly
    const isImageOrPdf = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    
    let extractedText = '';
    let isMediaSupported = isImageOrPdf;

    // For Office files and Plain Text, we extract text manually
    const isOffice = mimeType.includes('word') || 
                     mimeType.includes('excel') || 
                     mimeType.includes('spreadsheet') || 
                     mimeType.includes('officedocument') ||
                     mimeType === 'application/msword';
    
    const isPlainText = mimeType === 'text/plain';

    if (isPlainText) {
      const base64Data = input.attachmentDataUri.split(',')[1];
      extractedText = Buffer.from(base64Data, 'base64').toString('utf-8');
    } else if (isOffice) {
      extractedText = await extractTextFromOffice(input.attachmentDataUri, mimeType);
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
