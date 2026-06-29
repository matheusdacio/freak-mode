import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ConfigNotificacoes, NotificacoesService } from '@services/notificacoes.service';

@Component({
  selector: 'app-config',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <p class="kicker">PREFERÊNCIAS</p>
      <h1>CONFIGURAÇÕES</h1>
    </header>

    <section class="card anim-in">
      <h2 class="sec-titulo">Notificações</h2>

      @if (!svc.suportado) {
        <p class="muted">Seu navegador não suporta notificações push.</p>
      } @else if (svc.permissao() === 'denied') {
        <p class="aviso">
          Notificações bloqueadas. Acesse as configurações do navegador para permitir.
        </p>
      } @else if (svc.permissao() !== 'granted') {
        <div class="ativar-bloco">
          <p class="ativar-desc">Receba lembretes de treino, alertas de ofensiva e muito mais.</p>
          <button class="btn btn-primary" [disabled]="svc.ativando()" (click)="ativar()">
            {{ svc.ativando() ? 'Ativando…' : '🔔 Ativar notificações' }}
          </button>
          @if (erroAtivacao()) {
            <p class="aviso">{{ erroAtivacao() }}</p>
          }
        </div>
      } @else {
        <p class="status-ok">✓ Notificações ativas</p>
      }

      <div class="lista-notif" [class.desabilitada]="svc.permissao() !== 'granted'">

        <div class="item-notif">
          <div class="item-info">
            <span class="item-ico">🏋️</span>
            <div>
              <p class="item-titulo">Lembrete de treino</p>
              <p class="item-desc">Avisa se você ainda não treinou no dia</p>
            </div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="cfg().treino.ativa"
              [disabled]="svc.permissao() !== 'granted'"
              (change)="atualizar('treino', 'ativa', $event)"
            />
            <span class="slider"></span>
          </label>
        </div>

        @if (cfg().treino.ativa) {
          <div class="sub-config">
            <label class="sub-label">Horário do lembrete</label>
            <select class="select" (change)="atualizarHora($event)">
              @for (h of horas; track h.valor) {
                <option [value]="h.valor" [selected]="cfg().treino.hora === h.valor">
                  {{ h.label }}
                </option>
              }
            </select>
          </div>
        }

        <div class="item-notif">
          <div class="item-info">
            <span class="item-ico">🔥</span>
            <div>
              <p class="item-titulo">Ofensiva em risco</p>
              <p class="item-desc">Alerta às 22h se você não treinou e tem streak ativo</p>
            </div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="cfg().ofensiva.ativa"
              [disabled]="svc.permissao() !== 'granted'"
              (change)="atualizar('ofensiva', 'ativa', $event)"
            />
            <span class="slider"></span>
          </label>
        </div>

        <div class="item-notif">
          <div class="item-info">
            <span class="item-ico">💧</span>
            <div>
              <p class="item-titulo">Hidratação</p>
              <p class="item-desc">Lembretes a cada 2h das 8h às 20h</p>
            </div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="cfg().hidratacao.ativa"
              [disabled]="svc.permissao() !== 'granted'"
              (change)="atualizar('hidratacao', 'ativa', $event)"
            />
            <span class="slider"></span>
          </label>
        </div>

        <div class="item-notif">
          <div class="item-info">
            <span class="item-ico">⚖️</span>
            <div>
              <p class="item-titulo">Lembrete de peso</p>
              <p class="item-desc">Segunda-feira às 8h — hora de se pesar!</p>
            </div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="cfg().peso.ativa"
              [disabled]="svc.permissao() !== 'granted'"
              (change)="atualizar('peso', 'ativa', $event)"
            />
            <span class="slider"></span>
          </label>
        </div>

        <div class="item-notif">
          <div class="item-info">
            <span class="item-ico">📊</span>
            <div>
              <p class="item-titulo">Resumo semanal</p>
              <p class="item-desc">Domingo às 20h — quantas vezes você treinou</p>
            </div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="cfg().resumo.ativa"
              [disabled]="svc.permissao() !== 'granted'"
              (change)="atualizar('resumo', 'ativa', $event)"
            />
            <span class="slider"></span>
          </label>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .topo { padding: 1.5rem 0 1rem; }
    .kicker { font-size: 0.7rem; letter-spacing: 0.4em; color: var(--accent); font-weight: 700; }
    h1 { font-family: var(--font-display); font-size: 2.6rem; line-height: 0.95; text-transform: uppercase; margin-top: 0.25rem; }

    .card { background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; margin-bottom: 1rem; }
    .sec-titulo { font-family: var(--font-display); font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 1rem; }

    .ativar-bloco { display: flex; flex-direction: column; gap: 0.7rem; }
    .ativar-desc { font-size: 0.88rem; color: var(--muted); }
    .status-ok { font-size: 0.85rem; font-weight: 700; color: var(--accent-2); margin-bottom: 0.5rem; }
    .aviso { font-size: 0.82rem; color: #f87171; padding: 0.5rem 0.7rem; border-radius: var(--radius-sm); background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); }

    .lista-notif { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.1rem; }
    .lista-notif.desabilitada { opacity: 0.45; pointer-events: none; }

    .item-notif { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; padding: 0.75rem 0; border-bottom: 1px solid var(--line); }
    .item-notif:last-child { border-bottom: none; }
    .item-info { display: flex; align-items: center; gap: 0.7rem; flex: 1; }
    .item-ico { font-size: 1.3rem; flex-shrink: 0; }
    .item-titulo { font-weight: 700; font-size: 0.9rem; }
    .item-desc { font-size: 0.75rem; color: var(--muted); margin-top: 0.15rem; }

    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: var(--surface-2); border: 1px solid var(--line); border-radius: 999px; cursor: pointer; transition: background 0.2s; }
    .slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px; background: var(--muted); border-radius: 50%; transition: transform 0.2s, background 0.2s; }
    input:checked + .slider { background: var(--accent-soft); border-color: var(--accent-dim); }
    input:checked + .slider::before { transform: translateX(20px); background: var(--accent-2); }

    .sub-config { padding: 0.5rem 0 0.75rem 2rem; display: flex; align-items: center; gap: 0.7rem; }
    .sub-label { font-size: 0.8rem; color: var(--muted); white-space: nowrap; }
    .select { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.4rem 0.6rem; font-size: 0.85rem; color: var(--text); }
  `],
})
export class ConfigComponent implements OnInit {
  protected readonly svc = inject(NotificacoesService);
  protected readonly erroAtivacao = signal<string | null>(null);

  protected readonly horas = [
    { valor: 7,  label: '07:00' },
    { valor: 8,  label: '08:00' },
    { valor: 9,  label: '09:00' },
    { valor: 10, label: '10:00' },
    { valor: 11, label: '11:00' },
    { valor: 12, label: '12:00' },
    { valor: 13, label: '13:00' },
    { valor: 14, label: '14:00' },
    { valor: 15, label: '15:00' },
    { valor: 16, label: '16:00' },
    { valor: 17, label: '17:00' },
    { valor: 18, label: '18:00' },
    { valor: 19, label: '19:00' },
    { valor: 20, label: '20:00' },
    { valor: 21, label: '21:00' },
  ];

  protected cfg = this.svc.config;

  async ngOnInit(): Promise<void> {
    await this.svc.carregar();
  }

  protected async ativar(): Promise<void> {
    this.erroAtivacao.set(null);
    const resultado = await this.svc.ativar();
    if (resultado === 'negado') this.erroAtivacao.set('Permissão negada. Habilite nas configurações do navegador.');
    if (resultado === 'sem-suporte') this.erroAtivacao.set('Seu navegador não suporta notificações.');
  }

  protected atualizar(tipo: keyof Omit<ConfigNotificacoes, 'id' | 'token'>, campo: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const atual = this.svc.config();
    const novoConfig = {
      ...atual,
      [tipo]: { ...(atual[tipo] as object), [campo]: checked },
    } as ConfigNotificacoes;
    this.svc.salvar(novoConfig);
  }

  protected atualizarHora(event: Event): void {
    const hora = Number((event.target as HTMLSelectElement).value);
    const atual = this.svc.config();
    this.svc.salvar({ ...atual, treino: { ...atual.treino, hora } });
  }
}
