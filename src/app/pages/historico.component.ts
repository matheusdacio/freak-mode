import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercicio } from '@models/exercicio.model';
import { Sessao } from '@models/sessao.model';
import { Treino } from '@models/treino.model';
import { SessaoService } from '@services/sessao.service';
import { TreinoService } from '@services/treino.service';
import { LineChartComponent } from '../shared/line-chart.component';
import { labelRelativa } from '../shared/datas';
import { serieFeita } from '../shared/exercicio-util';

type Metrica = 'carga' | 'volume';

interface ProgressaoExercicio {
  nome: string;
  valores: number[];
}

/** Sessões mostradas na lista antes de "ver todas". */
const LIMITE_SESSOES = 5;

@Component({
  selector: 'app-historico',
  imports: [LineChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo anim-in">
        <button class="voltar" (click)="voltar()">← Treinos</button>
        <p class="kicker">PROGRESSÃO</p>
        <h1>{{ t.nome }}</h1>
        <p class="sessoes-info muted">
          {{ sessoes().length }}
          {{ sessoes().length === 1 ? 'sessão registrada' : 'sessões registradas' }}
        </p>
      </header>

      @if (sessoes().length === 0) {
        <div class="vazio anim-in">
          <span class="vazio-emoji">📊</span>
          <p class="muted">Nenhuma sessão ainda.<br />Execute o treino para começar a registrar.</p>
          <button class="btn btn-primary btn-block" (click)="executar()">
            Iniciar execução →
          </button>
        </div>
      } @else {
        <section class="sessoes anim-in">
          <div class="sec-topo">
            <h2 class="sec-titulo">SESSÕES</h2>
            <span class="sec-sub muted">toque para corrigir</span>
          </div>
          <ul class="sessao-lista">
            @for (s of sessoesVisiveis(); track s.id) {
              <li>
                <button class="sessao-item" (click)="editarSessao(s.id)">
                  <span class="sessao-ordem">Nº {{ s.ordem }}</span>
                  <span class="sessao-data">{{ s.data ? labelData(s.data) : 'sem data' }}</span>
                  <span class="sessao-series muted">{{ feitas(s) }}/{{ total(s) }} séries</span>
                  <span class="sessao-editar">✎</span>
                </button>
              </li>
            }
          </ul>
          @if (sessoes().length > limite) {
            <button class="ver-todas" (click)="todas.set(!todas())">
              {{ todas() ? 'ver menos' : 'ver todas (' + sessoes().length + ')' }}
            </button>
          }
        </section>

        <div class="seletor anim-in">
          <button
            class="opcao"
            [class.ativa]="metrica() === 'carga'"
            (click)="metrica.set('carga')"
          >
            Carga máx (kg)
          </button>
          <button
            class="opcao"
            [class.ativa]="metrica() === 'volume'"
            (click)="metrica.set('volume')"
          >
            Volume (kg × reps)
          </button>
        </div>

        @for (p of progressao(); track p.nome; let i = $index) {
          <section class="card anim-in" [style.animation-delay.ms]="i * 60">
            <div class="cabecalho">
              <h2>{{ p.nome }}</h2>
              <span class="atual">{{ p.valores.at(-1) }}</span>
            </div>
            <app-line-chart [valores]="p.valores" />
          </section>
        }

        <button class="btn btn-primary btn-block executar" (click)="executar()">
          Nova execução →
        </button>
      }
    } @else {
      <p class="muted carregando">Carregando…</p>
    }
  `,
  styles: [
    `
      .topo {
        padding: 1.5rem 0 1.25rem;
      }
      .voltar {
        color: var(--muted);
        font-size: 0.9rem;
        padding: 0.2rem 0;
        margin-bottom: 0.9rem;
        display: block;
      }
      .voltar:active {
        color: var(--accent-2);
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.6rem;
        line-height: 0.95;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }
      .sessoes-info {
        font-size: 0.85rem;
        margin-top: 0.3rem;
      }
      .vazio {
        text-align: center;
        padding: 2.5rem 1rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
      .vazio-emoji {
        font-size: 2.5rem;
      }
      .vazio p {
        line-height: 1.5;
      }
      .carregando {
        text-align: center;
        padding: 2rem;
      }

      /* ---- Sessões ---- */
      .sessoes {
        margin-bottom: 1.25rem;
      }
      .sec-topo {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.6rem;
      }
      .sec-titulo {
        font-size: 0.7rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--accent);
        font-weight: 700;
      }
      .sec-sub {
        font-size: 0.7rem;
      }
      .sessao-lista {
        list-style: none;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      .sessao-lista li + li {
        border-top: 1px solid var(--line);
      }
      .sessao-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 0.9rem;
        background: var(--surface);
        text-align: left;
        font-size: 0.85rem;
      }
      .sessao-item:active {
        background: var(--surface-2);
      }
      .sessao-ordem {
        font-family: var(--font-display);
        font-size: 1rem;
        color: var(--accent-2);
        min-width: 3rem;
      }
      .sessao-data {
        flex: 1;
        font-weight: 600;
      }
      .sessao-series {
        font-size: 0.75rem;
        white-space: nowrap;
      }
      .sessao-editar {
        color: var(--muted);
        opacity: 0.7;
      }
      .ver-todas {
        display: block;
        margin: 0.5rem auto 0;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--accent-2);
        padding: 0.3rem 0.6rem;
      }

      .seletor {
        display: flex;
        gap: 0.3rem;
        background: var(--surface);
        border: 1px solid var(--line);
        padding: 0.3rem;
        border-radius: 999px;
        margin-bottom: 1.25rem;
      }
      .opcao {
        flex: 1;
        padding: 0.6rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
        transition: color 0.15s ease;
      }
      .opcao.ativa {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        color: #fff;
        box-shadow: 0 4px 16px -4px var(--accent-glow);
      }
      .card {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 0.9rem;
      }
      .cabecalho {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        gap: 0.5rem;
      }
      .card h2 {
        font-family: var(--font-display);
        font-size: 1.3rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .atual {
        font-family: var(--font-display);
        font-size: 1.7rem;
        background: linear-gradient(135deg, var(--accent-2) 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        flex-shrink: 0;
      }
      .executar {
        margin-top: 0.5rem;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class HistoricoComponent implements OnInit {
  private readonly treinoSvc = inject(TreinoService);
  private readonly sessaoSvc = inject(SessaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly limite = LIMITE_SESSOES;
  protected readonly treino = signal<Treino | undefined>(undefined);
  protected readonly sessoes = signal<Sessao[]>([]);
  protected readonly metrica = signal<Metrica>('carga');
  protected readonly todas = signal(false);

  private readonly exPorId = computed(
    () => new Map((this.treino()?.exercicios ?? []).map((e): [string, Exercicio] => [e.id, e])),
  );

  /** Da mais recente para a mais antiga; a mais recente é a que costuma precisar de correção. */
  protected readonly sessoesVisiveis = computed(() => {
    const lista = [...this.sessoes()].reverse();
    return this.todas() ? lista : lista.slice(0, LIMITE_SESSOES);
  });

  protected readonly progressao = computed<ProgressaoExercicio[]>(() => {
    const sessoes = this.sessoes();
    const metrica = this.metrica();
    const mapa = new Map<string, { nome: string; valores: number[] }>();

    for (const sessao of sessoes) {
      for (const item of sessao.itens) {
        const valor = this.calcular(item.series, metrica);
        const atual = mapa.get(item.exercicioId);
        if (atual) {
          atual.nome = item.nomeExercicio;
          atual.valores.push(valor);
        } else {
          mapa.set(item.exercicioId, { nome: item.nomeExercicio, valores: [valor] });
        }
      }
    }

    return [...mapa.values()];
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.treino.set(await this.treinoSvc.obter(id));
    this.sessoes.set(await this.sessaoSvc.porTreino(id));
  }

  private calcular(
    series: readonly { peso: number | null; reps: number | null }[],
    metrica: Metrica,
  ): number {
    if (metrica === 'carga') {
      return series.reduce((max, s) => Math.max(max, s.peso ?? 0), 0);
    }
    return series.reduce((soma, s) => soma + (s.peso ?? 0) * (s.reps ?? 0), 0);
  }

  protected labelData(data: string): string {
    return labelRelativa(data);
  }

  protected feitas(s: Sessao): number {
    const mapa = this.exPorId();
    return s.itens.reduce(
      (n, item) => n + item.series.filter((x) => serieFeita(x, mapa.get(item.exercicioId))).length,
      0,
    );
  }

  protected total(s: Sessao): number {
    return s.itens.reduce((n, item) => n + item.series.length, 0);
  }

  protected editarSessao(sessaoId: string): void {
    const t = this.treino();
    if (t) this.router.navigate(['/treino', t.id, 'sessao', sessaoId]);
  }

  protected executar(): void {
    const t = this.treino();
    if (t) {
      this.router.navigate(['/treino', t.id, 'executar']);
    }
  }

  protected voltar(): void {
    this.router.navigate(['/']);
  }
}
