import { Event } from '../types';

/**
 * Matriz de Afinidad: Relaciona categorías con tags asociados.
 */
const AFFINITY_MATRIX: Record<string, { tags: string[], related: string[], weight: number }> = {
  "Gastro": {
    tags: ["Foodie", "Gourmet", "Vino", "Degustación"],
    related: ["Cultura", "Música"],
    weight: 1.2
  },
  "Tech": {
    tags: ["AI", "Blockchain", "Networking", "E-sports"],
    related: ["Innovación", "Gaming"],
    weight: 1.5
  },
  "Arte": {
    tags: ["Museo", "Galería", "Exposición", "Diseño"],
    related: ["Cultura", "Música"],
    weight: 1.3
  },
  "Bienestar": {
    tags: ["Yoga", "Meditación", "Fitness", "Salud"],
    related: ["Outdoor", "Desayuno"],
    weight: 1.1
  },
  "Música": {
    tags: ["Live", "Concierto", "Festival", "Pub"],
    related: ["Gastro", "Arte"],
    weight: 1.4
  },
  "Gaming": {
    tags: ["Tecnología", "Streaming", "Competitivo"],
    related: ["Tech", "Música"],
    weight: 1.0
  }
};

/**
 * Lógica de 'Cesta de la Compra' y Asociación de Datos.
 * Expande los intereses del usuario basados en su historial o interacciones.
 */
export function applyAssociationRules(userInterests: string[], userHistory: string[]): string[] {
  const expandedInterests = new Set([...userInterests]);

  // Expandir basado en la matriz de afinidad
  userInterests.forEach(interest => {
    const entry = AFFINITY_MATRIX[interest];
    if (entry) {
      entry.tags.forEach(tag => expandedInterests.add(tag));
      entry.related.forEach(rel => expandedInterests.add(rel));
    }
  });

  // Reglas de asociación condicionales (Heurística Staff-Level)
  if (userInterests.includes("Gastro") && userInterests.includes("Tech")) {
    expandedInterests.add("Networking Premium");
    expandedInterests.add("Eventos Privados");
  }

  if (userHistory.length > 5) {
    expandedInterests.add("Fidelidad");
  }

  return Array.from(expandedInterests);
}

/**
 * Calcula el score de afinidad entre un usuario y un evento.
 */
export function calculateAffinityScore(userInterests: string[], event: any, userHashtags: string[] = []): number {
  let score = 0;
  const categoryData = AFFINITY_MATRIX[event.categoria];
  
  // 1. Coincidencia Directa (Base 40 pts)
  if (userInterests.includes(event.categoria)) {
    score += 40 * (categoryData?.weight || 1);
  }

  // 2. Coincidencia de Descripción / Tags (Base 30 pts)
  const keywords = [...(categoryData?.tags || []), event.categoria.toLowerCase()];
  const descriptionMatches = keywords.filter(word => 
    event.descripcion.toLowerCase().includes(word.toLowerCase())
  ).length;
  score += Math.min(descriptionMatches * 5, 30);

  // 3. Coincidencia de Hashtags Sociales (Base 30 pts)
  const hashtagMatches = userHashtags.filter(h => 
    event.titulo.toLowerCase().includes(h.toLowerCase().replace('#', '')) ||
    event.descripcion.toLowerCase().includes(h.toLowerCase().replace('#', ''))
  ).length;
  score += Math.min(hashtagMatches * 10, 30);

  // 4. Boost para eventos Premium
  if (event.isPremium) score += 10;

  return Math.min(score, 100);
}
