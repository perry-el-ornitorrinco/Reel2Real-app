export type UserRole = 'user' | 'business';

export interface DigitalHandle {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface CustomReminder {
  id: string;
  eventId: string;
  userUid: string;
  remindAt: string; // ISO string
  title: string;
}

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
  ods_affinity?: string[];
}

export interface UserPrivateData {
  digitalHandles?: DigitalHandle;
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
  ticketUrl?: string; // Integration with Eventbrite/TicketMaster
  price?: number;
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
