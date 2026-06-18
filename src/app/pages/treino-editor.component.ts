import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';
import { Treino } from '@models/treino.model';
import { TreinoService } from '@services/treino.service';

@Component({
  selector: 'app-treino-editor',
  imports: [CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo anim-in">
        <button class="voltar" (click)="voltar()">← Treinos</button>
        <p class="kicker">EDITANDO</p>
        <input
          class="titulo"
          type="text"
          [value]="t.nome"
          (input)="renomear($event)"
          placeholder="Nome do treino"
        />
      </header>

      <section class="bloco anim-in">
        <h2>FOTO DE CAPA</h2>
        @if (t.capa) {
          <div class="capa-preview" [style.background-image]="'url(' + t.capa + ')'">
            <button class="capa-remover" (click)="removerCapa()">✕ Remover</button>
          </div>
        } @else {
          <label class="capa-add">
            <input type="file" accept="image/*" (change)="selecionarCapa($event)" />
            <span class="capa-icone">🖼</span>
            <span>Adicionar foto de capa</span>
          </label>
        }
      </section>

      <section class="bloco anim-in">
        <h2>EXERCÍCIOS <span class="contagem">{{ t.exercicios.length }}</span></h2>

        @if (t.exercicios.length === 0) {
          <p class="muted vazio">Adicione os exercícios deste treino abaixo.</p>
        } @else {
          <ul class="lista" cdkDropList (cdkDropListDropped)="dropExercicio($event)">
            @for (ex of t.exercicios; track ex.id; let i = $index) {
              <li class="ex" cdkDrag>
                <span class="alca-ex" cdkDragHandle>⠿</span>
                <div class="ex-corpo">
                  <div class="ex-topo">
                    <span class="ex-num">{{ i + 1 }}</span>
                    <input
                      class="ex-nome"
                      type="text"
                      [value]="ex.nome"
                      (input)="editarNome(i, $event)"
                      placeholder="Nome do exercício"
                    />
                    <button class="remover" (click)="removerExercicio(i)">🗑</button>
                  </div>
                  <div class="ex-controles">
                    <div class="contador">
                      <button class="step" (click)="ajustarSeries(i, -1)">−</button>
                      <span class="qtd">{{ ex.series }}<small>séries</small></span>
                      <button class="step" (click)="ajustarSeries(i, 1)">+</button>
                    </div>
                    <span class="sep">×</span>
                    <div class="contador">
                      <button class="step" (click)="ajustarReps(i, -1)">−</button>
                      <span class="qtd">
                        {{ ex.reps ? ex.reps : '—' }}<small>reps</small>
                      </span>
                      <button class="step" (click)="ajustarReps(i, 1)">+</button>
                    </div>
                  </div>
                </div>
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
      <p class="muted carregando">Carregando…</p>
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
        margin-bottom: 0.9rem;
        padding: 0.2rem 0;
      }
      .voltar:active {
        color: var(--accent-2);
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--accent);
        font-weight: 700;
        margin-bottom: 0.2rem;
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
        text-transform: uppercase;
        transition: border-color 0.15s ease;
      }
      .titulo:focus {
        border-color: var(--accent);
      }
      .bloco {
        margin-top: 1.5rem;
      }
      h2 {
        font-size: 0.7rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .contagem {
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        color: var(--accent-2);
        border-radius: 999px;
        padding: 0.1rem 0.5rem;
        font-size: 0.68rem;
        letter-spacing: 0;
      }
      .capa-preview {
        height: 170px;
        border-radius: var(--radius);
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--line-strong);
        box-shadow: 0 8px 28px -10px rgba(0, 0, 0, 0.7);
      }
      .capa-remover {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        background: rgba(0, 0, 0, 0.75);
        color: var(--danger);
        font-size: 0.78rem;
        font-weight: 700;
        border-radius: var(--radius-sm);
        padding: 0.4rem 0.65rem;
        border: 1px solid rgba(255, 90, 82, 0.4);
        letter-spacing: 0.05em;
        backdrop-filter: blur(4px);
      }
      .capa-add {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        height: 96px;
        border: 1.5px dashed var(--line-strong);
        border-radius: var(--radius);
        color: var(--muted);
        font-size: 0.88rem;
        cursor: pointer;
        transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
      }
      .capa-icone {
        font-size: 1.4rem;
        opacity: 0.7;
      }
      .capa-add:hover,
      .capa-add:active {
        border-color: var(--accent-dim);
        color: var(--text);
        background: var(--accent-soft);
      }
      .capa-add input {
        display: none;
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
        align-items: flex-start;
        gap: 0.4rem;
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.65rem 0.65rem 0.65rem 0.4rem;
      }
      .alca-ex {
        display: flex;
        align-items: center;
        padding: 0.35rem;
        color: var(--muted);
        cursor: grab;
        touch-action: none;
        user-select: none;
        font-size: 1.05rem;
        flex-shrink: 0;
      }
      .alca-ex:active {
        cursor: grabbing;
        color: var(--accent);
      }
      .ex-corpo {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        min-width: 0;
      }
      .ex-topo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .ex-num {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 999px;
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        color: var(--accent-2);
        font-size: 0.72rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .ex-nome {
        flex: 1;
        min-width: 0;
        background: transparent;
        border: none;
        font-size: 1rem;
        font-weight: 600;
        outline: none;
      }
      .remover {
        font-size: 0.95rem;
        opacity: 0.6;
        padding: 0.1rem 0.2rem;
        flex-shrink: 0;
      }
      .remover:active {
        opacity: 1;
      }
      .ex-controles {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .contador {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: var(--bg);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.2rem;
      }
      .sep {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--muted);
      }
      .step {
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 999px;
        background: var(--surface-2);
        font-size: 1.15rem;
        line-height: 1;
        color: var(--accent-2);
      }
      .step:active {
        background: var(--accent-dim);
        color: #fff;
      }
      .qtd {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
        min-width: 2.4rem;
        font-weight: 700;
        font-size: 0.95rem;
      }
      .qtd small {
        font-size: 0.56rem;
        color: var(--muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
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
        padding: 1rem 0 0.5rem;
        background: linear-gradient(transparent, var(--bg) 35%);
      }
      .executar {
        background: var(--surface-2);
        color: var(--text);
        border: 1px solid var(--accent-dim);
      }
      .carregando {
        text-align: center;
        padding: 2rem;
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
    if (id) this.treino.set(await this.svc.obter(id));
  }

  private patch(fn: (t: Treino) => void): void {
    const atual = this.treino();
    if (!atual) return;
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
    if (!nome) return;
    this.patch((t) => t.exercicios.push(this.svc.novoExercicio(nome, 3)));
    input.value = '';
    input.focus();
  }

  protected editarNome(index: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.patch((t) => {
      const ex = t.exercicios[index];
      if (ex) ex.nome = valor;
    });
  }

  protected ajustarSeries(index: number, delta: number): void {
    this.patch((t) => {
      const ex = t.exercicios[index];
      if (ex) ex.series = Math.max(1, ex.series + delta);
    });
  }

  protected ajustarReps(index: number, delta: number): void {
    this.patch((t) => {
      const ex = t.exercicios[index];
      if (ex) {
        const atual = ex.reps ?? 0;
        const novo = Math.max(0, atual + delta);
        ex.reps = novo > 0 ? novo : undefined;
      }
    });
  }

  protected removerExercicio(index: number): void {
    this.patch((t) => t.exercicios.splice(index, 1));
  }

  protected dropExercicio(event: CdkDragDrop<unknown[]>): void {
    this.patch((t) => moveItemInArray(t.exercicios, event.previousIndex, event.currentIndex));
  }

  protected async selecionarCapa(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const base64 = await this.comprimirImagem(file);
    this.patch((t) => { t.capa = base64; });
  }

  protected removerCapa(): void {
    this.patch((t) => { t.capa = undefined; });
  }

  private comprimirImagem(file: File): Promise<string> {
    return new Promise<string>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 380;
        const ctx = canvas.getContext('2d')!;
        const ratio = Math.max(800 / img.width, 380 / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.drawImage(img, (800 - w) / 2, (380 - h) / 2, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = url;
    });
  }

  protected async salvarEVoltar(): Promise<void> {
    const t = this.treino();
    if (t) await this.svc.salvar(t);
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
