import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { FirebaseService } from '@services/firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);

  readonly usuario = signal<User | null | undefined>(undefined);

  constructor() {
    onAuthStateChanged(this.firebase.auth, user => {
      this.usuario.set(user);
    });
  }

  async entrar(email: string, senha: string): Promise<void> {
    await signInWithEmailAndPassword(this.firebase.auth, email, senha);
  }

  async registrar(email: string, senha: string): Promise<void> {
    await createUserWithEmailAndPassword(this.firebase.auth, email, senha);
  }

  async sair(): Promise<void> {
    await signOut(this.firebase.auth);
  }
}
