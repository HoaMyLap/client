import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function createStompClient(projectId: string, onMessageReceived: (message: any) => void) {
  const socketUrl = 'http://localhost:8000/ws';
  
  const client = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    debug: (str) => {
      console.log('STOMP DEBUG:', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onConnect = (frame) => {
    console.log('STOMP Connected:', frame);
    client.subscribe(`/topic/projects/${projectId}`, (message) => {
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          onMessageReceived(parsed);
        } catch (e) {
          console.error('Failed to parse socket message:', e);
        }
      }
    });
  };

  client.onStompError = (frame) => {
    console.error('STOMP Broker error:', frame.headers['message']);
    console.error('STOMP Detailed error:', frame.body);
  };

  client.activate();
  
  return client;
}

export function createNotificationStompClient(userId: string, onNotificationReceived: (notification: any) => void) {
  const socketUrl = 'http://localhost:8000/ws';
  
  const client = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    debug: (str) => {
      console.log('STOMP NOTIF DEBUG:', str);
    },
    reconnectDelay: 5000,
  });

  client.onConnect = (frame) => {
    console.log('STOMP Notif Connected:', frame);
    client.subscribe(`/topic/notifications/${userId}`, (message) => {
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          onNotificationReceived(parsed);
        } catch (e) {
          console.error('Failed to parse notification message:', e);
        }
      }
    });
  };

  client.activate();
  
  return client;
}
