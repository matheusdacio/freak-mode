import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TreinoService } from '@services/treino.service';
import { Treino } from '@models/treino.model';
import { AuthService } from '@services/auth.service';
import { Conquista, ConquistasService } from '@services/conquistas.service';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-treinos',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <div class="topo-linha">
        <div>
          <p class="kicker">SEM DESCULPAS</p>
          <h1>TREINOS</h1>
        </div>
        <button class="btn-sair" (click)="sair()" title="Sair da conta">SAIR</button>
      </div>
    </header>

    @if (svc.carregado()) {
      <div class="stats anim-in">
        <div class="stat">
          <span class="stat-num">{{ totalSessoes() }}</span>
          <span class="stat-label">Sessões</span>
        </div>
        <div class="stat" [class.stat--fogo]="streak() > 0">
          <span class="stat-num">
            @if (streak() > 0) {🔥 }{{ streak() }}
          </span>
          <span class="stat-label">Dias seguidos</span>
        </div>
        <div class="stat">
          <span class="stat-num">
            {{ conquistasGanhas() }}<small>/{{ conquistas().length }}</small>
          </span>
          <span class="stat-label">Conquistas</span>
        </div>
      </div>
    }

    <div class="criar anim-in">
      <input
        class="field"
        type="text"
        placeholder="Nome do treino (ex: Push, Pull, Legs…)"
        [formControl]="nome"
        (keyup.enter)="criar()"
      />
      <button class="btn btn-primary" [disabled]="nome.invalid" (click)="criar()">
        Criar
      </button>
    </div>

    @if (svc.carregado()) {
      @if (svc.treinos().length === 0) {
        <div class="vazio anim-in">
          <span class="vazio-emoji">🏋️</span>
          <p class="muted">Nenhum treino ainda.<br />Crie o primeiro acima e entre no modo freak.</p>
        </div>
      } @else {
        <ul class="lista" cdkDropList (cdkDropListDropped)="drop($event)">
          @for (t of svc.treinos(); track t.id) {
            <li
              class="card anim-in"
              cdkDrag
              [class.card--capa]="!!t.capa"
              [style.animation-delay.ms]="$index * 60"
            >
              @if (t.capa) {
                <div class="capa-img" [style.background-image]="'url(' + t.capa + ')'"></div>
                <div class="capa-overlay"></div>
              } @else {
                <span class="marca">{{ t.nome.charAt(0) }}</span>
              }
              <div class="card-inner">
                <button class="card-main" (click)="executar(t.id)">
                  <span class="nome">{{ t.nome }}</span>
                  <span class="meta">
                    {{ t.exercicios.length }}
                    {{ t.exercicios.length === 1 ? 'exercício' : 'exercícios' }}
                    <span class="iniciar">· INICIAR ▶</span>
                  </span>
                </button>
                <div class="card-barra">
                  <span class="alca" cdkDragHandle>⠿</span>
                  <div class="acoes">
                    <button class="acao" title="Histórico" (click)="historico(t.id)">📈</button>
                    <button class="acao" title="Editar" (click)="editar(t.id)">✎</button>
                    <button class="acao" title="Excluir" (click)="remover(t)">🗑</button>
                  </div>
                </div>
              </div>
            </li>
          }
        </ul>
      }

      @if (conquistas().length > 0) {
        <section class="sec-conquistas anim-in">
          <div class="sec-topo">
            <h2 class="sec-titulo">CONQUISTAS</h2>
            <span class="sec-contagem muted">
              {{ conquistasGanhas() }}/{{ conquistas().length }}
            </span>
          </div>
          <div class="badges-grid">
            @for (c of conquistas(); track c.id) {
              <div class="badge" [class.badge--ganho]="c.conquistada" [title]="c.descricao">
                <span class="badge-emoji">{{ c.emoji }}</span>
                <span class="badge-titulo">{{ c.titulo }}</span>
              </div>
            }
          </div>
        </section>
      }
    } @else {
      <p class="muted carregando">Carregando…</p>
    }
  `,
  styles: [
    `
      .topo {
        padding: 2rem 0 1.25rem;
      }
      .topo-linha {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 3.6rem;
        line-height: 0.9;
        letter-spacing: 0.01em;
        background: linear-gradient(180deg, var(--text) 55%, rgba(244, 242, 248, 0.55) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .btn-sair {
        font-size: 0.7rem;
        color: var(--muted);
        letter-spacing: 0.15em;
        font-weight: 700;
        padding: 0.45rem 0.8rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        margin-top: 0.4rem;
      }
      .btn-sair:active {
        color: var(--text);
        border-color: var(--line-strong);
      }

      /* ---- Stats ---- */
      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.6rem;
        margin-bottom: 1.25rem;
      }
      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 130%);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.8rem 0.4rem 0.7rem;
      }
      .stat--fogo {
        border-color: var(--accent-dim);
        box-shadow: 0 0 20px -6px var(--accent-glow);
      }
      .stat-num {
        font-family: var(--font-display);
        font-size: 1.6rem;
        line-height: 1;
        color: var(--text);
      }
      .stat-num small {
        font-size: 0.95rem;
        color: var(--muted);
      }
      .stat-label {
        font-size: 0.62rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        font-weight: 700;
      }

      .criar {
        display: flex;
        gap: 0.6rem;
        margin-bottom: 1.5rem;
      }
      .criar .field {
        flex: 1;
      }

      .vazio {
        text-align: center;
        padding: 3rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
      }
      .vazio-emoji {
        font-size: 2.5rem;
        filter: grayscale(0.3);
      }
      .vazio p {
        line-height: 1.5;
      }
      .carregando {
        text-align: center;
        padding: 2rem;
      }

      .lista {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin-bottom: 2rem;
      }

      /* ---- Card ---- */
      .card {
        position: relative;
        border-radius: var(--radius);
        overflow: hidden;
        border: 1px solid var(--line);
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        display: flex;
        flex-direction: column;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .card:active {
        border-color: var(--accent-dim);
      }
      .marca {
        position: absolute;
        right: -0.5rem;
        top: -1.4rem;
        font-family: var(--font-display);
        font-size: 7rem;
        line-height: 1;
        color: rgba(168, 85, 247, 0.07);
        pointer-events: none;
        user-select: none;
        text-transform: uppercase;
      }
      .capa-img {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        pointer-events: none;
      }
      .capa-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(8, 7, 12, 0.05) 0%,
          rgba(8, 7, 12, 0.92) 100%
        );
        pointer-events: none;
      }
      .card-inner {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .card-main {
        flex: 1;
        text-align: left;
        padding: 1.2rem 1.1rem 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .card--capa .card-main {
        min-height: 150px;
        justify-content: flex-end;
      }
      .nome {
        font-family: var(--font-display);
        font-size: 1.7rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .meta {
        font-size: 0.8rem;
        color: var(--muted);
      }
      .card--capa .meta {
        color: rgba(244, 242, 248, 0.75);
      }
      .iniciar {
        color: var(--accent-2);
        font-weight: 700;
        letter-spacing: 0.06em;
        font-size: 0.72rem;
      }
      .card-barra {
        display: flex;
        align-items: stretch;
        border-top: 1px solid var(--line);
      }
      .card--capa .card-barra {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
      }
      .alca {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.6rem;
        font-size: 1.05rem;
        color: var(--muted);
        touch-action: none;
        cursor: grab;
        border-right: 1px solid var(--line);
        flex-shrink: 0;
        user-select: none;
        padding: 0.55rem 0;
      }
      .alca:active {
        cursor: grabbing;
        color: var(--accent);
      }
      .acoes {
        flex: 1;
        display: flex;
        justify-content: flex-end;
      }
      .acao {
        padding: 0.55rem 0.85rem;
        font-size: 0.95rem;
        opacity: 0.75;
        border-left: 1px solid var(--line);
      }
      .acao:active {
        opacity: 1;
        background: rgba(255, 255, 255, 0.06);
      }

      /* ---- Conquistas ---- */
      .sec-conquistas {
        margin-top: 0.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--line);
      }
      .sec-topo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.9rem;
      }
      .sec-titulo {
        font-size: 0.7rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--accent);
        font-weight: 700;
      }
      .sec-contagem {
        font-size: 0.8rem;
        font-weight: 700;
      }
      .badges-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 0.6rem;
        padding-bottom: 1rem;
      }
      .badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.9rem 0.5rem 0.8rem;
        transition: border-color 0.25s ease, box-shadow 0.25s ease;
      }
      .badge .badge-emoji {
        filter: grayscale(1);
        opacity: 0.3;
      }
      .badge--ganho {
        border-color: var(--accent-dim);
        background: linear-gradient(150deg, var(--surface) 0%, var(--accent-soft) 130%);
        box-shadow: 0 0 18px -8px var(--accent-glow);
      }
      .badge--ganho .badge-emoji {
        filter: none;
        opacity: 1;
      }
      .badge-emoji {
        font-size: 1.8rem;
        line-height: 1;
      }
      .badge-titulo {
        font-size: 0.66rem;
        font-weight: 700;
        text-align: center;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--muted);
        line-height: 1.25;
      }
      .badge--ganho .badge-titulo {
        color: var(--text);
      }
    `,
  ],
})
export class TreinosComponent implements OnInit {
  protected readonly svc = inject(TreinoService);
  private readonly conquistasSvc = inject(ConquistasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly conquistas = signal<Conquista[]>([]);
  protected readonly streak = signal(0);
  protected readonly totalSessoes = signal(0);

  protected readonly nome = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  async ngOnInit(): Promise<void> {
    await this.svc.carregar();
    try {
      const resultado = await this.conquistasSvc.computar();
      this.conquistas.set(resultado.conquistas);
      this.streak.set(resultado.streak);
      this.totalSessoes.set(resultado.totalSessoes);
    } catch {
      // conquistas são opcionais — silencia erros de rede
    }
  }

  protected conquistasGanhas(): number {
    return this.conquistas().filter(c => c.conquistada).length;
  }

  protected drop(event: CdkDragDrop<Treino[]>): void {
    const lista = [...this.svc.treinos()];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.svc.reordenar(lista);
  }

  protected async criar(): Promise<void> {
    if (this.nome.invalid) return;
    const treino = await this.svc.criar(this.nome.value);
    this.nome.reset();
    this.router.navigate(['/treino', treino.id]);
  }

  protected editar(id: string): void {
    this.router.navigate(['/treino', id]);
  }

  protected executar(id: string): void {
    this.router.navigate(['/treino', id, 'executar']);
  }

  protected historico(id: string): void {
    this.router.navigate(['/treino', id, 'historico']);
  }

  protected async remover(t: { id: string; nome: string }): Promise<void> {
    if (confirm(`Excluir o treino "${t.nome}"? As sessões salvas continuam no histórico.`)) {
      await this.svc.remover(t.id);
    }
  }

  protected async sair(): Promise<void> {
    await this.auth.sair();
    this.router.navigate(['/login']);
  }
}
