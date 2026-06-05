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

@Component({
  selector: 'app-treinos',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo">
      <p class="kicker">MEUS</p>
      <h1>TREINOS</h1>
    </header>

    <div class="criar">
      <input
        class="field"
        type="text"
        placeholder="Nome do treino (ex: Treino A, Legging)"
        [formControl]="nome"
        (keyup.enter)="criar()"
      />
      <button class="btn btn-primary" [disabled]="nome.invalid" (click)="criar()">
        Criar
      </button>
    </div>

    @if (svc.carregado()) {
      @if (svc.treinos().length === 0) {
        <p class="vazio muted">
          Nenhum treino ainda. Crie o primeiro acima 💪
        </p>
      } @else {
        <ul class="lista">
          @for (t of svc.treinos(); track t.id) {
            <li class="card">
              <button class="card-main" (click)="executar(t.id)">
                <span class="nome">{{ t.nome }}</span>
                <span class="meta muted">
                  {{ t.exercicios.length }}
                  {{ t.exercicios.length === 1 ? 'exercício' : 'exercícios' }}
                </span>
              </button>
              <div class="acoes">
                <button class="acao" title="Histórico" (click)="historico(t.id)">
                  📈
                </button>
                <button class="acao" title="Editar" (click)="editar(t.id)">
                  ✎
                </button>
                <button class="acao perigo" title="Excluir" (click)="remover(t)">
                  🗑
                </button>
              </div>
            </li>
          }
        </ul>
      }
    } @else {
      <p class="muted">Carregando…</p>
    }
  `,
  styles: [
    `
      .topo {
        padding: 2rem 0 1.25rem;
      }
      .kicker {
        font-size: 0.85rem;
        letter-spacing: 0.35em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 3.4rem;
        line-height: 0.9;
        letter-spacing: 0.01em;
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
      }
      .lista {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }
      .card {
        display: flex;
        align-items: stretch;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .card-main {
        flex: 1;
        text-align: left;
        padding: 1.1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .nome {
        font-family: var(--font-display);
        font-size: 1.5rem;
        letter-spacing: 0.02em;
      }
      .meta {
        font-size: 0.85rem;
      }
      .acoes {
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--line);
      }
      .acao {
        flex: 1;
        padding: 0 1rem;
        font-size: 1rem;
        opacity: 0.85;
      }
      .acao:not(:last-child) {
        border-bottom: 1px solid var(--line);
      }
      .acao:active {
        background: var(--surface-2);
      }
    `,
  ],
})
export class TreinosComponent implements OnInit {
  protected readonly svc = inject(TreinoService);
  private readonly router = inject(Router);

  protected readonly nome = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  async ngOnInit(): Promise<void> {
    await this.svc.carregar();
  }

  protected async criar(): Promise<void> {
    if (this.nome.invalid) {
      return;
    }
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
}
