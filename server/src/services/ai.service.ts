import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '../db';
import { TargetingSignal } from '../types/shared';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function interpretAudienceRequest(prompt: string, history: any[]) {
  const db = getDb();

  // Search taxonomy for keywords in the prompt to provide context
  const keywords = prompt.split(' ').filter(w => w.length > 3);
  const searchPromises = keywords.map(kw => 
    db.all(`SELECT * FROM taxonomy WHERE description LIKE ? OR value LIKE ? LIMIT 5`, [`%${kw}%`, `%${kw}%`])
  );
  const searchResults = (await Promise.all(searchPromises)).flat();
  const uniqueTaxonomy = Array.from(new Set(searchResults.map(s => JSON.stringify(s)))).map(s => JSON.parse(s));

  const systemPrompt = `
    You are an expert Media Planner AI. Your goal is to translate natural language audience descriptions into structured targeting signals.
    
    AVAILABLE TAXONOMY CONTEXT (Relevant matches):
    ${JSON.stringify(uniqueTaxonomy)}
    
    STRICT RULES:
    1. ONLY use targeting signals that exist in the PROVIDED TAXONOMY CONTEXT.
    2. DO NOT invent or hallucinate codes, field names, or values. 
    3. If a specific request (like 'left-handed') has no match in the taxonomy, DO NOT include a signal for it. Instead, mention in the 'content' that it's not available in the current data.
    4. Map specific requests to the nearest BROAD category available in the context (e.g., 'Luxury Pens' -> 'Stationery' or 'Writing Paper').
    
    Return a JSON response with:
       - "content": A conversational explanation of your recommendations.
       - "signals": An array of objects with { type, field, value, description }.
       - "insights": A short paragraph explaining the strategic "WHY" behind this audience (e.g., brand fit, conversion likelihood).
    
    EXAMPLE RESPONSE FORMAT:
    {
      "content": "...",
      "signals": [...],
      "insights": "This audience combines high-intent physical visits with specific interest in premium services, making them 3x more likely to convert for luxury campaigns compared to general fitness enthusiasts."
    }
  `;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-flash-preview',
    systemInstruction: systemPrompt 
  });

  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await chat.sendMessage(prompt);
  
  const text = result.response.text();
  const cleanJson = text.replace(/```json|```/g, '').trim();
  const response = JSON.parse(cleanJson);
  
  // Calculate estimated size
  response.estimatedSize = calculateAudienceSize(response.signals);
  
  return response;
}

function calculateAudienceSize(signals: TargetingSignal[]) {
  const BASE_POPULATION = 250_000_000;
  let multiplier = 1.0;

  signals.forEach(signal => {
    // Heuristic multipliers
    if (signal.type === 'demographic') {
      if (signal.field === 'age') multiplier *= 0.3; // age ranges are typically ~30%
      else if (signal.field === 'gender') multiplier *= 0.5;
      else multiplier *= 0.2;
    } else if (signal.type === 'interest') {
      multiplier *= 0.15; // interests are niche
    } else if (signal.type === 'location') {
      multiplier *= 0.08; // physical visits are rarer
    } else if (signal.type === 'transaction') {
      multiplier *= 0.12; // purchase behavior
    }
  });

  // Ensure we don't go too low or too high
  const finalSize = Math.floor(BASE_POPULATION * Math.max(multiplier, 0.001));
  // Add some jitter for realism
  return finalSize + Math.floor(Math.random() * 50000);
}
