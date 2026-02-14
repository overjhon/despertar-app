import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const usePushNotifications = (userId?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted' && userId) {
      try {
        const fbConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        } as any;

        if (await isSupported()) {
          const app = initializeApp(fbConfig);
          const messaging = getMessaging(app);
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY as string | undefined;
          const token = await getToken(messaging, { vapidKey });

          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            provider: 'fcm',
            fcm_token: token,
            enabled: true,
            subscription: { permission: 'granted', timestamp: new Date().toISOString() }
          });

          onMessage(messaging, (payload) => {
            console.log('Foreground push received', payload);
          });
        } else {
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            provider: 'web',
            enabled: true,
            subscription: { permission: 'granted', timestamp: new Date().toISOString() }
          });
        }
      } catch (error) {
        console.error('Error saving notification subscription:', error);
      }
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return { permission, requestPermission };
};
