import { useState, useEffect, useCallback } from 'react';

import { base44 } from '@/api/base44Client';
import { getVapidPublicKey } from '@/functions/getVapidPublicKey';
import { sendPushNotification } from '@/functions/sendPushNotification';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function usePushNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub && Notification.permission === 'granted');
    });
  }, []);

  const enable = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('permission_denied');

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { data } = await getVapidPublicKey({});
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      }

      const json = sub.toJSON();
      const existing = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
      if (existing.length === 0) {
        await base44.entities.PushSubscription.create({
          endpoint: sub.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          device_label: navigator.userAgent.slice(0, 120),
        });
      }
      setEnabled(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const records = await base44.entities.PushSubscription.filter({ endpoint });
        for (const r of records) await base44.entities.PushSubscription.delete(r.id);
      }
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) throw new Error('not_subscribed');
    const { data } = await sendPushNotification({
      title: 'התראת בדיקה 🔔',
      body: 'ההתראות פועלות! תקבלו עדכונים גם כשהאתר סגור.',
      url: '/',
      endpoint: sub.endpoint,
    });
    return data;
  }, []);

  return { supported, enabled, loading, enable, disable, sendTest };
}