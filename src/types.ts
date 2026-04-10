export type UserRole = 'user' | 'business';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  intereses: string[];
  hashtags_redes: string[];
  ubicacion: { lat: number; lng: number };
  timeSpentToday: number;
  businessInfo?: {
    nombreEstablecimiento: string;
    cif: string;
    categoria: string;
  };
  savedEvents?: string[];
  digitalHandles?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface Event {
  id: string;
  titulo: string;
  descripcion: string;
  foto_url: string;
  categoria: string;
  fecha: string; // ISO string
  ubicacion_gps: { lat: number; lng: number };
  aforo_max: number;
  asistentes_actuales: string[];
  isPremium: boolean;
  views: number;
  organizador_uid?: string;
  createdAt?: any;
}

export interface Match {
  id: string;
  event_id: string;
  users_list: string[];
  chat_id: string;
}

export interface HomePlan {
  titulo: string;
  materiales: string[];
  paso_a_paso: string[];
}
