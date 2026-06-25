import { inject, Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { AuthService } from '@services/auth.service';
import { FirebaseService } from '@services/firebase.service';

export type StoreName =
  | 'treinos'
  | 'sessoes'
  | 'alimentos'
  | 'dieta'
  | 'adesao'
  | 'pesos'
  | 'agua'
  | 'medidas'
  | 'config';

@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);

  private uid(): string {
    const uid = this.auth.usuario()?.uid;
    if (!uid) throw new Error('Não autenticado');
    return uid;
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    const col = collection(this.firebase.db, 'users', this.uid(), store);
    const snap = await getDocs(col);
    return snap.docs.map(d => d.data() as T);
  }

  async get<T>(store: StoreName, id: string): Promise<T | undefined> {
    const ref = doc(this.firebase.db, 'users', this.uid(), store, id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as T) : undefined;
  }

  async put<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
    const ref = doc(this.firebase.db, 'users', this.uid(), store, value.id);
    // JSON round-trip remove undefined values que o Firestore não aceita
    const data = JSON.parse(JSON.stringify(value)) as T;
    await setDoc(ref, data);
  }

  async delete(store: StoreName, id: string): Promise<void> {
    const ref = doc(this.firebase.db, 'users', this.uid(), store, id);
    await deleteDoc(ref);
  }
}
