import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase/firestore';

export async function sendPushNotificationToStores(title: string, body: string, data?: any) {
  try {
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where('expoPushToken', '!=', null));
    const querySnapshot = await getDocs(q);

    const tokens: string[] = [];
    querySnapshot.forEach((doc) => {
      const storeData = doc.data();
      if (storeData.expoPushToken) {
        tokens.push(storeData.expoPushToken);
      }
    });

    if (tokens.length === 0) {
      console.log('No stores with push tokens found');
      return;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'new_order_alert.mp3',
      title,
      body,
      data,
      channelId: 'order_alerts',
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log(`Sent push notifications to ${tokens.length} stores.`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
