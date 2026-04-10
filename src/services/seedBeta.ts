import { collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from './firebase';

const BETA_EVENTS = [
  {
    titulo: "Zenith Secret Cinema",
    descripcion: "Disfruta de un clásico del cine en un loft industrial secreto. Palomitas gourmet y debate posterior con un crítico de cine.",
    foto_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
    categoria: "Arte",
    fecha: "2026-05-15T21:00:00Z",
    ubicacion_gps: { lat: 40.4123, lng: -3.7032 },
    aforo_max: 30,
    asistentes_actuales: [],
    isPremium: true,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Wine & Paint Workshop",
    descripcion: "Saca el artista que llevas dentro mientras disfrutas de una selección de vinos tintos. Todo el material incluido.",
    foto_url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    categoria: "Arte",
    fecha: "2026-05-18T19:00:00Z",
    ubicacion_gps: { lat: 40.4256, lng: -3.7012 },
    aforo_max: 15,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Crossfit Community Games",
    descripcion: "Una competición amistosa para todos los niveles. Ven a sudar y a conocer a la comunidad fitness de Madrid.",
    foto_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    categoria: "Deporte",
    fecha: "2026-05-20T10:00:00Z",
    ubicacion_gps: { lat: 40.4452, lng: -3.6912 },
    aforo_max: 50,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Masterclass de Coctelería",
    descripcion: "Aprende a preparar los 3 cócteles más icónicos de la temporada con un mixólogo premiado.",
    foto_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    categoria: "Gastro",
    fecha: "2026-05-22T20:00:00Z",
    ubicacion_gps: { lat: 40.4182, lng: -3.6985 },
    aforo_max: 20,
    asistentes_actuales: [],
    isPremium: true,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Ruta de Galerías de Arte",
    descripcion: "Tour guiado por las galerías más vanguardistas del barrio de las Letras. Charla con galeristas incluida.",
    foto_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    categoria: "Arte",
    fecha: "2026-05-25T11:00:00Z",
    ubicacion_gps: { lat: 40.4125, lng: -3.6942 },
    aforo_max: 12,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Torneo de Pádel Zenith",
    descripcion: "Networking y deporte. Encuentra a tu pareja de negocios ideal en la pista de pádel.",
    foto_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
    categoria: "Deporte",
    fecha: "2026-05-28T17:00:00Z",
    ubicacion_gps: { lat: 40.4631, lng: -3.6783 },
    aforo_max: 32,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Cena a Ciegas",
    descripcion: "Pon a prueba tus sentidos en una cena donde el gusto y el olfato son los protagonistas. Menú sorpresa.",
    foto_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
    categoria: "Gastro",
    fecha: "2026-06-02T21:00:00Z",
    ubicacion_gps: { lat: 40.4212, lng: -3.7056 },
    aforo_max: 24,
    asistentes_actuales: [],
    isPremium: true,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Workshop de Fotografía Urbana",
    descripcion: "Aprende a capturar la arquitectura y la vida de Madrid con tu cámara o smartphone. Nivel principiante.",
    foto_url: "https://images.unsplash.com/photo-150298272282d-b052759518f8?auto=format&fit=crop&w=800&q=80",
    categoria: "Arte",
    fecha: "2026-06-05T10:30:00Z",
    ubicacion_gps: { lat: 40.4167, lng: -3.7033 },
    aforo_max: 15,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Sesión de Meditación Sonora",
    descripcion: "Relajación profunda con cuencos tibetanos y gongs. Desconecta del ruido de la ciudad.",
    foto_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    categoria: "Bienestar",
    fecha: "2026-06-10T19:30:00Z",
    ubicacion_gps: { lat: 40.4152, lng: -3.7073 },
    aforo_max: 20,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: serverTimestamp()
  },
  {
    titulo: "Mercadillo de Diseño Independiente",
    descripcion: "Pop-up store con los mejores diseñadores locales de Madrid. Moda, joyería y decoración.",
    foto_url: "https://images.unsplash.com/photo-1531050171669-014464ce0581?auto=format&fit=crop&w=800&q=80",
    categoria: "Arte",
    fecha: "2026-06-12T11:00:00Z",
    ubicacion_gps: { lat: 40.4121, lng: -3.7102 },
    aforo_max: 500,
    asistentes_actuales: [],
    isPremium: false,
    views: 0,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
  }
];

export const seedBetaEvents = async () => {
  // Check if they already exist to avoid duplicates
  const q = query(collection(db, 'events'), where('titulo', '==', "Zenith Secret Cinema"), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log("Beta events already seeded.");
    return;
  }

  console.log("Starting beta seed...");
  for (const event of BETA_EVENTS) {
    try {
      await addDoc(collection(db, 'events'), event);
      console.log(`Added beta event: ${event.titulo}`);
    } catch (e) {
      console.error("Error adding beta event: ", e);
    }
  }
  console.log("Beta seed complete!");
};
