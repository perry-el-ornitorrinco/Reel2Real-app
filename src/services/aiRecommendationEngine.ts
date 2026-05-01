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

export async function generateProactivePlans(interests: string[], lat: number, lng: number) {
  const prompt = `Genera 3 planes autogestionados de exterior (en la ciudad o naturaleza, NO en casa) basados en estos intereses: ${interests.join(", ")}.
  Los planes deben animar al usuario a salir (ej: Ruta fotográfica por el barrio, Reto de dibujo en un parque).
  Devuelve un JSON con el esquema exacto de un Evento (título, descripción, categoría, y ubicacion_gps con coordenadas cercanas a lat: ${lat}, lng: ${lng}).
  Incluye una 'foto_url' descriptiva abstracta de Unsplash (ej: https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80).`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            titulo: { type: Type.STRING },
            descripcion: { type: Type.STRING },
            foto_url: { type: Type.STRING },
            categoria: { type: Type.STRING },
            ubicacion_gps: { 
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              }
            },
            aforo_max: { type: Type.NUMBER },
            asistentes_actuales: { type: Type.ARRAY, items: { type: Type.STRING } },
            isPremium: { type: Type.BOOLEAN },
            fecha: { type: Type.STRING }
          },
          required: ["id", "titulo", "descripcion", "foto_url", "categoria", "ubicacion_gps", "aforo_max", "asistentes_actuales", "isPremium", "fecha"]
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
    model: "gemini-2.5-flash",
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
