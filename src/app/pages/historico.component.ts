import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sessao } from '@models/sessao.model';
import { Treino } from '@models/treino.model';
import { SessaoService } from '@services/sessao.service';
import { TreinoService } from '@services/treino.service';
import { LineChartComponent } from '../shared/line-chart.component';

type Metrica = 'carga' | 'volume';

interface ProgressaoExercicio {
  nome: string;
  valores: number[];
}

@Component({
  selector: 'app-historico',
  imports: [LineChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo">
        <button class="voltar" (click)="voltar()">← Treinos</button>
        <p class="kicker">PROGRESSÃO</p>
        <h1>{{ t.nome }}</h1>
        <p class="muted">
          {{ sessoes().length }}
          {{ sessoes().length === 1 ? 'sessão registrada' : 'sessões registradas' }}
        </p>
      </header>

      @if (sessoes().length === 0) {
        <p class="muted vazio">
          Nenhuma sessão ainda. Execute o treino para começar a registrar.
        </p>
        <button class="btn btn-primary btn-block" (click)="executar()">
          Iniciar execução →
        </button>
      } @else {
        <div class="seletor">
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

        @for (p of progressao(); track p.nome) {
          <section class="card">
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
      <p class="muted">Carregando…</p>
    }
  `,
  styles: [
    `
      .topo {
        padding: 1.5rem 0 1rem;
      }
      .voltar {
        color: var(--muted);
        font-size: 0.9rem;
      }
      .kicker {
        margin-top: 0.75rem;
        font-size: 0.75rem;
        letter-spacing: 0.25em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.6rem;
        line-height: 0.95;
      }
      .vazio {
        padding: 2rem 0 1rem;
      }
      .seletor {
        display: flex;
        gap: 0.4rem;
        background: var(--surface-2);
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
      }
      .opcao.ativa {
        background: var(--accent);
        color: #0a0b0a;
      }
      .card {
        background: var(--surface);
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
      }
      h2 {
        font-family: var(--font-display);
        font-size: 1.3rem;
        letter-spacing: 0.02em;
      }
      .atual {
        font-family: var(--font-display);
        font-size: 1.6rem;
        color: var(--accent);
      }
      .executar {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class HistoricoComponent implements OnInit {
  private readonly treinoSvc = inject(TreinoService);
  private readonly sessaoSvc = inject(SessaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly treino = signal<Treino | undefined>(undefined);
  protected readonly sessoes = signal<Sessao[]>([]);
  protected readonly metrica = signal<Metrica>('carga');

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
