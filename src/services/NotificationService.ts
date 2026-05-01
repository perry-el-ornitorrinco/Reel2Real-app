import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Event, CustomReminder } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private processedReminders: Set<string> = new Set();

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
      // 1. Check Default System Reminders (24h/1h)
      const qEvents = query(
        collection(db, 'events'),
        where('asistentes_actuales', 'array-contains', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(qEvents);
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const event = doc.data() as Event;
        const eventDate = new Date(event.fecha);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const reminderKey24 = `system-24h-${doc.id}`;
        const reminderKey1h = `system-1h-${doc.id}`;

        // 24 Hour Reminder
        if (diffHours > 23.5 && diffHours < 24.5 && !this.processedReminders.has(reminderKey24)) {
          this.sendLocalNotification(
            "Recordatorio: 24h para tu evento",
            `"${event.titulo}" comienza en 24 horas. ¡No te lo pierdas!`,
            event.foto_url
          );
          this.processedReminders.add(reminderKey24);
        }

        // 1 Hour Reminder
        if (diffHours > 0.5 && diffHours < 1.5 && !this.processedReminders.has(reminderKey1h)) {
          this.sendLocalNotification(
            "Recordatorio: 1h para tu evento",
            `"${event.titulo}" comienza en 1 hora. ¡Prepárate!`,
            event.foto_url
          );
          this.processedReminders.add(reminderKey1h);
        }
      });

      // 2. Check Custom User Reminders
      const qReminders = query(
        collection(db, 'reminders'),
        where('userUid', '==', auth.currentUser.uid)
      );

      const reminderSnapshot = await getDocs(qReminders);
      reminderSnapshot.forEach(async (reminderDoc) => {
        const reminder = reminderDoc.data() as CustomReminder;
        const remindAtDate = new Date(reminder.remindAt);
        const diffMs = remindAtDate.getTime() - now.getTime();

        // If the time has passed or is within the next 15 minutes
        if (diffMs <= 0 && !this.processedReminders.has(reminderDoc.id)) {
          this.sendLocalNotification(
            "Reel2Real: Tu recordatorio personalizado",
            `${reminder.title}`,
          );
          this.processedReminders.add(reminderDoc.id);
          // Optional: Clean up processed reminder from DB to avoid re-triggering across sessions
          await deleteDoc(doc(db, 'reminders', reminderDoc.id));
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

  public async scheduleCustomReminder(eventId: string, title: string, remindAt: Date) {
    if (!auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'reminders'), {
        eventId,
        userUid: auth.currentUser.uid,
        title,
        remindAt: remindAt.toISOString(),
        createdAt: new Date().toISOString()
      });
      this.sendLocalNotification("Recordatorio Guardado", `Te avisaremos el ${remindAt.toLocaleString()}`);
    } catch (error) {
      console.error("Error scheduling reminder:", error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
