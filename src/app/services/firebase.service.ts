import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging } from 'firebase/messaging';

const config = {
  apiKey: 'AIzaSyD8KFxq_38kal02zsHDKeozKcN5jdvCiO8',
  authDomain: 'freak-mode.firebaseapp.com',
  projectId: 'freak-mode',
  storageBucket: 'freak-mode.firebasestorage.app',
  messagingSenderId: '823861911777',
  appId: '1:823861911777:web:dc5b07bac8b296d75a97a0',
};

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp = initializeApp(config);
  readonly db: Firestore = getFirestore(this.app);
  readonly auth: Auth = getAuth(this.app);
  readonly messaging: Messaging = getMessaging(this.app);
}
