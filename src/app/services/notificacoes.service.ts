import { inject, Injectable, signal } from '@angular/core';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { DbService } from '@services/db.service';
import { FirebaseService } from '@services/firebase.service';

export interface ConfigNotificacoes {
  id: 'notificacoes';
  token: string | null;
  treino: { ativa: boolean; hora: number };
  ofensiva: { ativa: boolean };
  hidratacao: { ativa: boolean };
  peso: { ativa: boolean };
  resumo: { ativa: boolean };
}

// Gere em: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'COLE_SUA_VAPID_KEY_AQUI';

const DEFAULT_CONFIG: ConfigNotificacoes = {
  id: 'notificacoes',
  token: null,
  treino: { ativa: false, hora: 19 },
  ofensiva: { ativa: false },
  hidratacao: { ativa: false },
  peso: { ativa: false },
  resumo: { ativa: false },
};

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly firebase = inject(FirebaseService);
  private readonly db = inject(DbService);

  readonly config = signal<ConfigNotificacoes>(DEFAULT_CONFIG);
  readonly permissao = signal<NotificationPermission>('default');
  readonly ativando = signal(false);

  async carregar(): Promise<void> {
    if ('Notification' in window) this.permissao.set(Notification.permission);
    const salvo = await this.db.get<ConfigNotificacoes>('config', 'notificacoes');
    if (salvo) this.config.set({ ...DEFAULT_CONFIG, ...salvo });
  }

  async salvar(config: ConfigNotificacoes): Promise<void> {
    this.config.set(config);
    await this.db.put('config', config);
  }

  async ativar(): Promise<'ok' | 'negado' | 'sem-suporte'> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'sem-suporte';

    this.ativando.set(true);
    try {
      const perm = await Notification.requestPermission();
      this.permissao.set(perm);
      if (perm !== 'granted') return 'negado';

      const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = getMessaging(this.firebase.app);
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });

      await this.salvar({ ...this.config(), token });

      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'FreakMode';
        const body = payload.notification?.body ?? '';
        new Notification(title, { body, icon: '/icons/icon-192.png' });
      });

      return 'ok';
    } finally {
      this.ativando.set(false);
    }
  }

  get suportado(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
}
