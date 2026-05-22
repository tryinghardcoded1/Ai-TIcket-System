// Mock Firebase Messaging Support
export interface Messaging {
  app: any;
  name: string;
}

export const getMessaging = (app?: any) => {
  return {
    app,
    name: '[MockMessaging]'
  };
};

export const getToken = async (messaging: any, options?: { vapidKey?: string }) => {
  console.log('[Mock FCM] Generating virtual VAPID push token...');
  return 'mock-fcm-token-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
};

export const onMessage = (messaging: any, callback: (payload: any) => void) => {
  console.log('[Mock FCM] Foreground notification handler active');
  // Return dummy unsubscribe callback
  return () => {
    console.log('[Mock FCM] Foreground notification handler detached');
  };
};
