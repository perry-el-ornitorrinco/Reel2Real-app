import { Event } from '../types';

/**
 * Matriz de Afinidad: Relaciona categorías con tags asociados.
 */
const AFFINITY_MATRIX: Record<string, string[]> = {
  "Cafetería de Especialidad": ["Lectura", "Networking", "Minimalismo"],
  "Concierto": ["Cerveza Artesana", "Pub", "Música"],
  "Yoga": ["Desayuno Saludable", "Parque", "Bienestar"],
  "Gaming": ["Tecnología", "Streaming", "E-sports"],
  "Cultura": ["Arte", "Historia", "Museo"],
  "Deporte": ["Outdoor", "Salud", "Aventura"]
};

/**
 * Lógica de 'Cesta de la Compra' y Asociación de Datos.
 * Expande los intereses del usuario basados en su historial o interacciones.
 */
export function applyAssociationRules(userInterests: string[], userHistory: string[]): string[] {
  const expandedInterests = new Set([...userInterests]);

  // Si el usuario ha interactuado con ciertas categorías, añadimos tags asociados
  userHistory.forEach(category => {
    if (AFFINITY_MATRIX[category]) {
      AFFINITY_MATRIX[category].forEach(tag => expandedInterests.add(tag));
    }
  });

  // Lógica específica: Si tiene 'Cafetería de Especialidad', priorizamos 'Lectura'
  if (userInterests.includes("Cafetería de Especialidad")) {
    expandedInterests.add("Lectura");
    expandedInterests.add("Networking");
  }

  return Array.from(expandedInterests);
}

/**
 * Calcula el score de afinidad entre un usuario y un evento.
 */
export function calculateAffinityScore(userInterests: string[], eventCategory: string, eventTags: string[]): number {
  let score = 0;
  
  // Coincidencia directa de categoría
  if (userInterests.includes(eventCategory)) score += 5;
  
  // Coincidencias en tags asociados
  const associatedTags = AFFINITY_MATRIX[eventCategory] || [];
  const matches = associatedTags.filter(tag => userInterests.includes(tag)).length;
  score += matches * 2;

  // Coincidencia con tags del evento
  const tagMatches = eventTags.filter(tag => userInterests.includes(tag)).length;
  score += tagMatches;

  return score;
}
