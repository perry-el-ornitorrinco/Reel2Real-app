import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Jaccard Similarity: Intersection / Union
 */
export function calculateJaccardSimilarity(arr1: string[], arr2: string[]): number {
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export async function generateHomePlans(interests: string[]) {
  const prompt = `Genera 3 planes creativos para hacer en casa basados en estos intereses: ${interests.join(", ")}. Devuelve formato JSON con título, materiales y paso a paso.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            materiales: { type: Type.ARRAY, items: { type: Type.STRING } },
            paso_a_paso: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["titulo", "materiales", "paso_a_paso"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function analyzeDigitalProfile(handles: { instagram?: string; twitter?: string; linkedin?: string }) {
  const prompt = `Analiza estos perfiles digitales (Instagram: ${handles.instagram || 'N/A'}, Twitter: ${handles.twitter || 'N/A'}, LinkedIn: ${handles.linkedin || 'N/A'}). 
  Infiere sus intereses principales (máximo 10) y hashtags representativos (máximo 10). 
  Devuelve un JSON con 'intereses' (array de strings) y 'hashtags' (array de strings). 
  Sé creativo y premium en la selección.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intereses: { type: Type.ARRAY, items: { type: Type.STRING } },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["intereses", "hashtags"]
      }
    }
  });

  return JSON.parse(response.text || '{"intereses": [], "hashtags": []}');
}
