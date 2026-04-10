import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Event } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  public sendLocalNotification(title: string, body: string, icon?: string) {
    if (this.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
      });
    } else {
      console.log(`[Notification Mock]: ${title} - ${body}`);
    }
  }

  /**
   * Checks for upcoming events and schedules reminders.
   * In a real production app, this logic would run on a server (Cloud Functions).
   * For this MVP, we run it client-side when the app is active.
   */
  public async checkUpcomingEvents() {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, 'events'),
        where('asistentes_actuales', 'array-contains', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const event = doc.data() as Event;
        const eventDate = new Date(event.fecha);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // 24 Hour Reminder
        if (diffHours > 23.5 && diffHours < 24.5) {
          this.sendLocalNotification(
            "Recordatorio: 24h para tu evento",
            `"${event.titulo}" comienza en 24 horas. ¡No te lo pierdas!`,
            event.foto_url
          );
        }

        // 1 Hour Reminder
        if (diffHours > 0.5 && diffHours < 1.5) {
          this.sendLocalNotification(
            "Recordatorio: 1h para tu evento",
            `"${event.titulo}" comienza en 1 hora. ¡Prepárate!`,
            event.foto_url
          );
        }
      });
    } catch (error) {
      console.error("Error checking upcoming events:", error);
    }
  }

  /**
   * Sets up a periodic check for notifications.
   */
  public startReminderCheck(intervalMinutes: number = 15) {
    // Initial check
    this.checkUpcomingEvents();
    
    // Periodic check
    setInterval(() => {
      this.checkUpcomingEvents();
    }, intervalMinutes * 60 * 1000);
  }
}

export const notificationService = NotificationService.getInstance();
