import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Treino } from '@models/treino.model';
import { TreinoService } from '@services/treino.service';

@Component({
  selector: 'app-treino-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo">
        <button class="voltar" (click)="voltar()">← Treinos</button>
        <input
          class="titulo"
          type="text"
          [value]="t.nome"
          (input)="renomear($event)"
          placeholder="Nome do treino"
        />
      </header>

      <section class="bloco">
        <h2>Exercícios</h2>

        @if (t.exercicios.length === 0) {
          <p class="muted vazio">Adicione os exercícios deste treino abaixo.</p>
        } @else {
          <ul class="lista">
            @for (ex of t.exercicios; track ex.id; let i = $index) {
              <li class="ex">
                <input
                  class="ex-nome"
                  type="text"
                  [value]="ex.nome"
                  (input)="editarNome(i, $event)"
                  placeholder="Nome do exercício"
                />
                <div class="series">
                  <button class="step" (click)="ajustarSeries(i, -1)">−</button>
                  <span class="qtd">{{ ex.series }}<small>séries</small></span>
                  <button class="step" (click)="ajustarSeries(i, 1)">+</button>
                </div>
                <button class="remover" (click)="removerExercicio(i)">🗑</button>
              </li>
            }
          </ul>
        }

        <div class="adicionar">
          <input
            #novo
            class="field"
            type="text"
            placeholder="Novo exercício…"
            (keyup.enter)="adicionar(novo)"
          />
          <button class="btn btn-ghost" (click)="adicionar(novo)">+ Adicionar</button>
        </div>
      </section>

      <div class="rodape">
        <button class="btn btn-primary btn-block" (click)="salvarEVoltar()">
          Salvar treino
        </button>
        <button class="btn btn-block executar" (click)="executar()">
          Iniciar execução →
        </button>
      </div>
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
        margin-bottom: 0.75rem;
      }
      .titulo {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--line);
        font-family: var(--font-display);
        font-size: 2.4rem;
        padding: 0.2rem 0;
        outline: none;
      }
      .titulo:focus {
        border-color: var(--accent);
      }
      .bloco {
        margin-top: 1rem;
      }
      h2 {
        font-size: 0.85rem;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 0.75rem;
      }
      .vazio {
        padding: 1rem 0;
      }
      .lista {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .ex {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.55rem 0.6rem;
      }
      .ex-nome {
        flex: 1;
        min-width: 0;
        background: transparent;
        border: none;
        font-size: 1rem;
        outline: none;
      }
      .series {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--surface-2);
        border-radius: 999px;
        padding: 0.2rem;
      }
      .step {
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 999px;
        background: var(--bg);
        font-size: 1.2rem;
        line-height: 1;
        color: var(--accent);
      }
      .qtd {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
        min-width: 2.5rem;
        font-weight: 700;
      }
      .qtd small {
        font-size: 0.6rem;
        color: var(--muted);
        font-weight: 500;
      }
      .remover {
        font-size: 1rem;
        opacity: 0.7;
        padding: 0.2rem;
      }
      .adicionar {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.9rem;
      }
      .adicionar .field {
        flex: 1;
      }
      .rodape {
        position: sticky;
        bottom: 0;
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        padding-top: 1rem;
        background: linear-gradient(transparent, var(--bg) 30%);
      }
      .executar {
        background: var(--surface-2);
        color: var(--text);
        border: 1px solid var(--accent-dim);
      }
    `,
  ],
})
export class TreinoEditorComponent implements OnInit {
  private readonly svc = inject(TreinoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly treino = signal<Treino | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.treino.set(await this.svc.obter(id));
    }
  }

  private patch(fn: (t: Treino) => void): void {
    const atual = this.treino();
    if (!atual) {
      return;
    }
    const copia: Treino = { ...atual, exercicios: atual.exercicios.map((e) => ({ ...e })) };
    fn(copia);
    this.treino.set(copia);
  }

  protected renomear(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.patch((t) => (t.nome = valor));
  }

  protected adicionar(input: HTMLInputElement): void {
    const nome = input.value.trim();
    if (!nome) {
      return;
    }
    this.patch((t) => t.exercicios.push(this.svc.novoExercicio(nome, 3)));
    input.value = '';
    input.focus();
  }

  protected editarNome(index: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.patch((t) => {
      const ex = t.exercicios[index];
      if (ex) {
        ex.nome = valor;
      }
    });
  }

  protected ajustarSeries(index: number, delta: number): void {
    this.patch((t) => {
      const ex = t.exercicios[index];
      if (ex) {
        ex.series = Math.max(1, ex.series + delta);
      }
    });
  }

  protected removerExercicio(index: number): void {
    this.patch((t) => t.exercicios.splice(index, 1));
  }

  protected async salvarEVoltar(): Promise<void> {
    const t = this.treino();
    if (t) {
      await this.svc.salvar(t);
    }
    this.voltar();
  }

  protected async executar(): Promise<void> {
    const t = this.treino();
    if (t) {
      await this.svc.salvar(t);
      this.router.navigate(['/treino', t.id, 'executar']);
    }
  }

  protected voltar(): void {
    this.router.navigate(['/']);
  }
}
