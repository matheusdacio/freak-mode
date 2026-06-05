import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sessao } from '@models/sessao.model';
import { Treino } from '@models/treino.model';
import { SessaoService } from '@services/sessao.service';
import { TreinoService } from '@services/treino.service';

@Component({
  selector: 'app-execucao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo">
        <button class="voltar" (click)="voltar()">← Treinos</button>
        <p class="kicker">EXECUTANDO · {{ ordemLabel() }}</p>
        <h1>{{ t.nome }}</h1>
      </header>

      @if (sessao(); as s) {
        @if (s.itens.length === 0) {
          <p class="muted vazio">
            Este treino não tem exercícios. Edite-o para adicionar.
          </p>
        }

        @for (item of s.itens; track item.exercicioId; let ei = $index) {
          <section class="ex">
            <h2>{{ item.nomeExercicio }}</h2>
            <div class="grade-cabecalho">
              <span>Série</span><span>Peso (kg)</span><span>Reps</span>
            </div>
            @for (serie of item.series; track $index; let si = $index) {
              <div class="grade">
                <span class="serie-num">{{ si + 1 }}</span>
                <input
                  class="cell"
                  type="number"
                  inputmode="decimal"
                  [value]="serie.peso ?? ''"
                  (input)="setPeso(ei, si, $event)"
                  placeholder="—"
                />
                <input
                  class="cell"
                  type="number"
                  inputmode="numeric"
                  [value]="serie.reps ?? ''"
                  (input)="setReps(ei, si, $event)"
                  placeholder="—"
                />
              </div>
            }
            <input
              class="field notas"
              type="text"
              [value]="item.notas"
              (input)="setNotas(ei, $event)"
              placeholder="Notas (opcional)…"
            />
          </section>
        }

        <div class="rodape">
          <button class="btn btn-primary btn-block" (click)="salvar()">
            Concluir e salvar sessão
          </button>
        </div>
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
        padding: 2rem 0;
      }
      .ex {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 0.9rem;
      }
      h2 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        margin-bottom: 0.75rem;
        letter-spacing: 0.02em;
      }
      .grade-cabecalho,
      .grade {
        display: grid;
        grid-template-columns: 2.5rem 1fr 1fr;
        gap: 0.5rem;
        align-items: center;
      }
      .grade-cabecalho {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--muted);
        margin-bottom: 0.4rem;
      }
      .grade {
        margin-bottom: 0.45rem;
      }
      .serie-num {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--surface-2);
        font-weight: 700;
        color: var(--accent);
      }
      .cell {
        background: var(--surface-2);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.7rem;
        font-size: 1.1rem;
        font-weight: 600;
        text-align: center;
        outline: none;
        width: 100%;
      }
      .cell:focus {
        border-color: var(--accent);
      }
      .notas {
        margin-top: 0.6rem;
        font-size: 0.9rem;
      }
      .rodape {
        position: sticky;
        bottom: 0;
        padding: 1rem 0 0;
        margin-top: 1rem;
        background: linear-gradient(transparent, var(--bg) 30%);
      }
    `,
  ],
})
export class ExecucaoComponent implements OnInit {
  private readonly treinoSvc = inject(TreinoService);
  private readonly sessaoSvc = inject(SessaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly treino = signal<Treino | undefined>(undefined);
  protected readonly sessao = signal<Sessao | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    const t = await this.treinoSvc.obter(id);
    this.treino.set(t);
    if (t) {
      this.sessao.set(await this.sessaoSvc.novaSessao(t));
    }
  }

  protected ordemLabel(): string {
    const ordem = this.sessao()?.ordem ?? 1;
    return `SESSÃO Nº ${ordem}`;
  }

  private patch(fn: (s: Sessao) => void): void {
    const atual = this.sessao();
    if (!atual) {
      return;
    }
    const copia: Sessao = {
      ...atual,
      itens: atual.itens.map((i) => ({ ...i, series: i.series.map((x) => ({ ...x })) })),
    };
    fn(copia);
    this.sessao.set(copia);
  }

  private numero(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    if (raw.trim() === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  protected setPeso(ei: number, si: number, event: Event): void {
    const v = this.numero(event);
    this.patch((s) => {
      const serie = s.itens[ei]?.series[si];
      if (serie) {
        serie.peso = v;
      }
    });
  }

  protected setReps(ei: number, si: number, event: Event): void {
    const v = this.numero(event);
    this.patch((s) => {
      const serie = s.itens[ei]?.series[si];
      if (serie) {
        serie.reps = v;
      }
    });
  }

  protected setNotas(ei: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.patch((s) => {
      const item = s.itens[ei];
      if (item) {
        item.notas = valor;
      }
    });
  }

  protected async salvar(): Promise<void> {
    const s = this.sessao();
    if (s) {
      await this.sessaoSvc.salvar(s);
    }
    this.router.navigate(['/treino', s?.treinoId, 'historico']);
  }

  protected voltar(): void {
    this.router.navigate(['/']);
  }
}
