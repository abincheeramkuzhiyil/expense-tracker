'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { scheduleNotification, cancelNotification } from '@/utils/notificationScheduler';

/**
 * Mounts in the root layout. Watches settings + notification permission and
 * (re)schedules the daily reminder. Renders nothing.
 */
export default function NotificationSchedulerProvider() {
  const { settings, isLoaded } = useSettings();

  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    if (settings.notificationEnabled && Notification.permission === 'granted') {
      scheduleNotification(settings.notificationTime);
    } else {
      cancelNotification();
    }

    return () => {
      cancelNotification();
    };
  }, [isLoaded, settings.notificationEnabled, settings.notificationTime]);

  return null;
}
