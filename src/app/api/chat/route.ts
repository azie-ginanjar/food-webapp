import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60;

// Safely extract text from any UIMessage shape (content string OR parts[])
function extractText(m: any): string {
  if (typeof m.content === 'string' && m.content) return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('');
  }
  return '';
}

export async function POST(req: Request) {
  const body = await req.json();

  const uiMessages: any[] = Array.isArray(body.messages) ? body.messages : [];
  const experimental_attachments: any[] = Array.isArray(body.experimental_attachments)
    ? body.experimental_attachments
    : [];

  // Build core messages manually — robust against all UIMessage shapes
  let coreMessages: any[] = uiMessages
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: extractText(m) || (m.role === 'user' ? 'What is this food?' : ''),
    }));

  // Inject image parts into the last user message if attachments were sent
  if (experimental_attachments.length > 0) {
    const imageParts = experimental_attachments.map((a: any) => ({
      type: 'image' as const,
      image: a.url as string,
    }));

    if (coreMessages.length > 0) {
      const last = coreMessages[coreMessages.length - 1];
      let textContent = 'What is this food?';
      if (typeof last.content === 'string' && last.content) {
        textContent = last.content;
      } else if (Array.isArray(last.content)) {
        const tp = last.content.find((p: any) => p.type === 'text');
        if (tp) textContent = (tp as any).text;
      }
      coreMessages = [
        ...coreMessages.slice(0, -1),
        { role: 'user' as const, content: [{ type: 'text' as const, text: textContent }, ...imageParts] },
      ];
    } else {
      coreMessages = [
        {
          role: 'user' as const,
          content: [{ type: 'text' as const, text: 'What is this food?' }, ...imageParts],
        },
      ];
    }
  }

  const systemPrompt = `You are a friendly, knowledgeable nutritionist. 
When the user shows you a picture of food for the first time, you MUST respond with a hidden JSON nutrition block wrapped in <<NUTRITION_JSON>>...<</NUTRITION_JSON>> delimiters. 
After the JSON block, provide a friendly natural language intro about the food.

The JSON MUST match this TypeScript interface exactly:
export interface NutritionData {
  servingsPerContainer: string;
  servingSize: string;
  calories: number;
  totalFat: { amount: string; dv: number };
  saturatedFat: { amount: string; dv: number };
  transFat: { amount: string };
  cholesterol: { amount: string; dv: number };
  sodium: { amount: string; dv: number };
  totalCarb: { amount: string; dv: number };
  dietaryFiber: { amount: string; dv: number };
  totalSugars: { amount: string };
  addedSugars: { amount: string; dv: number };
  protein: { amount: string };
  vitaminD: { amount: string; dv: number };
  calcium: { amount: string; dv: number };
  iron: { amount: string; dv: number };
  potassium: { amount: string; dv: number };
}

Example valid JSON output:
<<NUTRITION_JSON>>
{
  "servingsPerContainer": "1",
  "servingSize": "1 bowl (300g)",
  "calories": 450,
  "totalFat": { "amount": "15g", "dv": 19 },
  "saturatedFat": { "amount": "3g", "dv": 15 },
  "transFat": { "amount": "0g" },
  "cholesterol": { "amount": "45mg", "dv": 15 },
  "sodium": { "amount": "850mg", "dv": 37 },
  "totalCarb": { "amount": "55g", "dv": 20 },
  "dietaryFiber": { "amount": "8g", "dv": 29 },
  "totalSugars": { "amount": "12g" },
  "addedSugars": { "amount": "4g", "dv": 8 },
  "protein": { "amount": "25g" },
  "vitaminD": { "amount": "0mcg", "dv": 0 },
  "calcium": { "amount": "120mg", "dv": 10 },
  "iron": { "amount": "3.5mg", "dv": 20 },
  "potassium": { "amount": "600mg", "dv": 15 }
}
<</NUTRITION_JSON>>

For all subsequent turns, behave as an approachable, conversational nutritionist. Provide realistic estimates based on the visual appearance of the food. DO NOT wrap your normal text in the JSON tags, only the data object.`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}
