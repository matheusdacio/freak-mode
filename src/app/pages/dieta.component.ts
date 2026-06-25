import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DietaService } from '@services/dieta.service';
import { Alimento, DiaDieta, MetasDieta } from '@models/dieta.model';

type Overlay = 'none' | 'add' | 'metas';
type ModoAdd = 'lib' | 'novo';

@Component({
  selector: 'app-dieta',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <p class="kicker">NUTRIÇÃO</p>
      <div class="topo-linha">
        <h1>DIETA</h1>
        <button class="btn-metas" (click)="abrirMetas()">⚙️ Metas</button>
      </div>
    </header>

    <!-- Navegação de dia -->
    <div class="dia-nav anim-in">
      <button class="seta" (click)="mudarDia(-1)">‹</button>
      <span class="dia-label">{{ labelData() }}</span>
      <button class="seta" (click)="mudarDia(1)" [disabled]="ehHoje()">›</button>
    </div>

    @if (dia(); as d) {
      <!-- Resumo de macros -->
      <section class="resumo anim-in">
        @for (m of totais(); track m.key) {
          <div class="macro">
            <div class="macro-topo">
              <span class="macro-label">{{ m.label }}</span>
              <span class="macro-val">
                <strong>{{ m.atual }}</strong>/{{ m.meta }}{{ m.un }}
              </span>
            </div>
            <div class="trilha">
              <div
                class="fill"
                [class.fill--estourou]="m.atual > m.meta && m.meta > 0"
                [style.width.%]="m.pct"
              ></div>
            </div>
          </div>
        }
      </section>

      <!-- Refeições -->
      @for (r of d.refeicoes; track r.id) {
        <section class="refeicao anim-in">
          <div class="ref-cabecalho">
            <h2>{{ r.nome }}</h2>
            <span class="ref-kcal">{{ totalKcalRefeicao(r.id) }} kcal</span>
          </div>

          @for (it of r.itens; track it.id) {
            <div class="item">
              <div class="item-info">
                <span class="item-nome">{{ it.nome }}</span>
                <span class="item-sub muted">
                  {{ it.quantidade }}× {{ it.porcao }} · {{ it.proteina }}P
                  {{ it.carbo }}C {{ it.gordura }}G
                </span>
              </div>
              <span class="item-kcal">{{ it.kcal }}</span>
              <button class="item-x" (click)="removerItem(r.id, it.id)">✕</button>
            </div>
          } @empty {
            <p class="ref-vazio muted">Nada lançado ainda.</p>
          }

          <button class="add-item" (click)="abrirAdd(r.id)">＋ Adicionar alimento</button>
        </section>
      }

      <button class="btn btn-ghost nova-ref" (click)="adicionarRefeicao()">
        ＋ Nova refeição
      </button>
    } @else {
      <p class="muted carregando">Carregando…</p>
    }

    <!-- ===== Overlay: adicionar alimento ===== -->
    @if (overlay() === 'add') {
      <div class="backdrop" (click)="fechar()"></div>
      <div class="sheet anim-up">
        <div class="sheet-handle"></div>
        <h3>Adicionar a {{ nomeRefeicaoAlvo() }}</h3>

        <div class="seg">
          <button class="seg-op" [class.ativa]="modoAdd() === 'lib'" (click)="modoAdd.set('lib')">
            Biblioteca
          </button>
          <button class="seg-op" [class.ativa]="modoAdd() === 'novo'" (click)="modoAdd.set('novo')">
            Novo alimento
          </button>
        </div>

        @if (modoAdd() === 'lib') {
          <input
            class="field"
            type="text"
            placeholder="Buscar alimento…"
            [(ngModel)]="busca"
          />
          <div class="lista-alim">
            @for (a of alimentosFiltrados(); track a.id) {
              <button
                class="alim"
                [class.sel]="alimentoSel()?.id === a.id"
                (click)="alimentoSel.set(a)"
              >
                <span class="alim-nome">{{ a.nome }}</span>
                <span class="alim-macro muted">
                  {{ a.kcal }}kcal · {{ a.proteina }}P {{ a.carbo }}C {{ a.gordura }}G / {{ a.porcao }}
                </span>
              </button>
            } @empty {
              <p class="muted lista-vazia">
                @if (busca) { Nenhum alimento encontrado. } @else { Biblioteca vazia — cadastre em "Novo alimento". }
              </p>
            }
          </div>

          @if (alimentoSel(); as a) {
            <div class="confirma">
              <div class="qtd">
                <span class="qtd-label">Qtd (porções)</span>
                <input class="field qtd-input" type="number" inputmode="decimal" [(ngModel)]="quantidade" />
              </div>
              <button class="btn btn-primary" (click)="confirmarLib()">
                Adicionar {{ previewKcal(a) }} kcal
              </button>
            </div>
          }
        } @else {
          <div class="form-novo">
            <input class="field" type="text" placeholder="Nome do alimento" [(ngModel)]="novo.nome" />
            <input class="field" type="text" placeholder="Porção de referência (ex: 100g)" [(ngModel)]="novo.porcao" />
            <div class="grid-macros">
              <label>Kcal<input class="field" type="number" inputmode="numeric" [(ngModel)]="novo.kcal" /></label>
              <label>Prot (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="novo.proteina" /></label>
              <label>Carbo (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="novo.carbo" /></label>
              <label>Gord (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="novo.gordura" /></label>
            </div>
            <div class="qtd">
              <span class="qtd-label">Qtd (porções)</span>
              <input class="field qtd-input" type="number" inputmode="decimal" [(ngModel)]="quantidade" />
            </div>
            <button class="btn btn-primary btn-block" [disabled]="!novo.nome.trim()" (click)="confirmarNovo()">
              Salvar e adicionar
            </button>
          </div>
        }

        <button class="btn btn-block fechar-sheet" (click)="fechar()">Cancelar</button>
      </div>
    }

    <!-- ===== Overlay: metas ===== -->
    @if (overlay() === 'metas') {
      <div class="backdrop" (click)="fechar()"></div>
      <div class="sheet anim-up">
        <div class="sheet-handle"></div>
        <h3>Metas diárias</h3>
        <div class="grid-macros">
          <label>Kcal<input class="field" type="number" inputmode="numeric" [(ngModel)]="metaForm.kcal" /></label>
          <label>Prot (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="metaForm.proteina" /></label>
          <label>Carbo (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="metaForm.carbo" /></label>
          <label>Gord (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="metaForm.gordura" /></label>
        </div>
        <button class="btn btn-primary btn-block" (click)="salvarMetas()">Salvar metas</button>
        <button class="btn btn-block fechar-sheet" (click)="fechar()">Cancelar</button>
      </div>
    }
  `,
  styles: [
    `
      .topo {
        padding: 1.5rem 0 0.5rem;
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--accent);
        font-weight: 700;
      }
      .topo-linha {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.6rem;
        line-height: 0.95;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }
      .btn-metas {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--muted);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        background: var(--surface);
      }
      .btn-metas:active {
        color: var(--accent-2);
        border-color: var(--accent-dim);
      }

      .dia-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 0.5rem 0 1.1rem;
      }
      .seta {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 999px;
        background: var(--surface);
        border: 1px solid var(--line);
        font-size: 1.4rem;
        line-height: 1;
        color: var(--text);
      }
      .seta:disabled {
        opacity: 0.35;
      }
      .dia-label {
        font-family: var(--font-display);
        font-size: 1.2rem;
        text-transform: uppercase;
        min-width: 5rem;
        text-align: center;
      }

      .resumo {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }
      .macro-topo {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.3rem;
        font-size: 0.85rem;
      }
      .macro-label {
        font-weight: 600;
      }
      .macro-val strong {
        font-family: var(--font-display);
        font-size: 1.05rem;
      }
      .trilha {
        height: 7px;
        border-radius: 999px;
        background: var(--bg);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent-dim) 0%, var(--accent) 100%);
        box-shadow: 0 0 8px var(--accent-glow);
        transition: width 0.3s ease;
      }
      .fill--estourou {
        background: linear-gradient(90deg, #b8860b 0%, var(--danger) 100%);
      }

      .refeicao {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 0.9rem 1rem;
        margin-bottom: 0.8rem;
      }
      .ref-cabecalho {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      h2 {
        font-family: var(--font-display);
        font-size: 1.25rem;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .ref-kcal {
        font-size: 0.8rem;
        color: var(--accent-2);
        font-weight: 700;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.45rem 0;
        border-top: 1px solid var(--line);
      }
      .item-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .item-nome {
        font-size: 0.95rem;
        font-weight: 600;
      }
      .item-sub {
        font-size: 0.72rem;
      }
      .item-kcal {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .item-x {
        color: var(--muted);
        font-size: 0.85rem;
        padding: 0.2rem 0.3rem;
      }
      .item-x:active {
        color: var(--danger);
      }
      .ref-vazio {
        font-size: 0.82rem;
        padding: 0.4rem 0;
      }
      .add-item {
        margin-top: 0.5rem;
        width: 100%;
        text-align: center;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--accent-2);
        padding: 0.5rem;
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius-sm);
      }
      .add-item:active {
        background: var(--accent-soft);
      }
      .nova-ref {
        width: 100%;
        margin: 0.2rem 0 1rem;
      }
      .carregando {
        text-align: center;
        padding: 2rem;
      }

      /* ---- overlay / bottom sheet ---- */
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(2px);
        z-index: 60;
      }
      .sheet {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 61;
        max-width: 560px;
        margin: 0 auto;
        background: var(--surface);
        border: 1px solid var(--line-strong);
        border-bottom: none;
        border-radius: 20px 20px 0 0;
        padding: 0.6rem 1.1rem calc(1.1rem + env(safe-area-inset-bottom));
        max-height: 86vh;
        overflow-y: auto;
      }
      .sheet-handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: var(--line-strong);
        margin: 0.3rem auto 0.8rem;
      }
      .sheet h3 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        text-transform: uppercase;
        margin-bottom: 0.8rem;
      }
      .seg {
        display: flex;
        gap: 0.3rem;
        background: var(--bg);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.25rem;
        margin-bottom: 0.8rem;
      }
      .seg-op {
        flex: 1;
        padding: 0.5rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
      }
      .seg-op.ativa {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        color: #fff;
      }
      .lista-alim {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin: 0.7rem 0;
        max-height: 38vh;
        overflow-y: auto;
      }
      .alim {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.1rem;
        text-align: left;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--bg);
      }
      .alim.sel {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-soft);
      }
      .alim-nome {
        font-weight: 600;
        font-size: 0.92rem;
      }
      .alim-macro {
        font-size: 0.72rem;
      }
      .lista-vazia {
        font-size: 0.85rem;
        padding: 1rem 0;
        text-align: center;
      }
      .confirma {
        display: flex;
        gap: 0.6rem;
        align-items: flex-end;
        margin-top: 0.5rem;
      }
      .qtd {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .qtd-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        font-weight: 700;
      }
      .qtd-input {
        width: 5rem;
        text-align: center;
      }
      .confirma .btn {
        flex: 1;
      }
      .form-novo {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .grid-macros {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .grid-macros label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        font-weight: 700;
      }
      .fechar-sheet {
        margin-top: 0.6rem;
        color: var(--muted);
      }
    `,
  ],
})
export class DietaComponent implements OnInit {
  private readonly svc = inject(DietaService);

  protected readonly dataAtual = signal<string>('');
  protected readonly dia = signal<DiaDieta | undefined>(undefined);
  protected readonly metas = signal<MetasDieta | undefined>(undefined);
  protected readonly alimentos = signal<Alimento[]>([]);

  protected readonly overlay = signal<Overlay>('none');
  protected readonly modoAdd = signal<ModoAdd>('lib');
  protected readonly refeicaoAlvo = signal<string | null>(null);
  protected readonly alimentoSel = signal<Alimento | undefined>(undefined);

  // campos de formulário (template-driven)
  protected busca = '';
  protected quantidade = 1;
  protected novo = {
    nome: '',
    porcao: '',
    kcal: null as number | null,
    proteina: null as number | null,
    carbo: null as number | null,
    gordura: null as number | null,
  };
  protected metaForm = { kcal: 0, proteina: 0, carbo: 0, gordura: 0 };

  protected readonly totais = computed(() => {
    const d = this.dia();
    const m = this.metas();
    const t = d ? this.svc.totaisDia(d) : { kcal: 0, proteina: 0, carbo: 0, gordura: 0 };
    const metas = m ?? { kcal: 0, proteina: 0, carbo: 0, gordura: 0, id: '' };
    return [
      { key: 'kcal', label: 'Calorias', un: '', atual: t.kcal, meta: metas.kcal },
      { key: 'p', label: 'Proteína', un: 'g', atual: t.proteina, meta: metas.proteina },
      { key: 'c', label: 'Carbo', un: 'g', atual: t.carbo, meta: metas.carbo },
      { key: 'g', label: 'Gordura', un: 'g', atual: t.gordura, meta: metas.gordura },
    ].map((x) => ({
      ...x,
      pct: x.meta > 0 ? Math.min(100, Math.round((x.atual / x.meta) * 100)) : 0,
    }));
  });

  async ngOnInit(): Promise<void> {
    this.metas.set(await this.svc.obterMetas());
    this.alimentos.set(await this.svc.listarAlimentos());
    await this.carregarDia(this.svc.hoje());
  }

  private async carregarDia(data: string): Promise<void> {
    this.dataAtual.set(data);
    this.dia.set(await this.svc.obterDia(data));
  }

  protected ehHoje(): boolean {
    return this.dataAtual() === this.svc.hoje();
  }

  protected labelData(): string {
    const d = this.dataAtual();
    if (!d) return '';
    if (d === this.svc.hoje()) return 'Hoje';
    if (d === this.addDias(this.svc.hoje(), -1)) return 'Ontem';
    const [, m, dd] = d.split('-');
    return `${dd}/${m}`;
  }

  protected async mudarDia(delta: number): Promise<void> {
    await this.carregarDia(this.addDias(this.dataAtual(), delta));
  }

  private addDias(data: string, delta: number): string {
    const [y, m, d] = data.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  protected totalKcalRefeicao(refId: string): number {
    const r = this.dia()?.refeicoes.find((x) => x.id === refId);
    return r ? this.svc.totaisRefeicao(r).kcal : 0;
  }

  protected nomeRefeicaoAlvo(): string {
    const id = this.refeicaoAlvo();
    return this.dia()?.refeicoes.find((r) => r.id === id)?.nome ?? '';
  }

  protected alimentosFiltrados(): Alimento[] {
    const q = this.busca.trim().toLowerCase();
    const lista = this.alimentos();
    return q ? lista.filter((a) => a.nome.toLowerCase().includes(q)) : lista;
  }

  protected previewKcal(a: Alimento): number {
    return Math.round(a.kcal * (this.quantidade > 0 ? this.quantidade : 1));
  }

  // ---- overlays ----
  protected abrirAdd(refId: string): void {
    this.refeicaoAlvo.set(refId);
    this.modoAdd.set('lib');
    this.busca = '';
    this.quantidade = 1;
    this.alimentoSel.set(undefined);
    this.novo = { nome: '', porcao: '', kcal: null, proteina: null, carbo: null, gordura: null };
    this.overlay.set('add');
  }

  protected abrirMetas(): void {
    const m = this.metas();
    if (m) this.metaForm = { kcal: m.kcal, proteina: m.proteina, carbo: m.carbo, gordura: m.gordura };
    this.overlay.set('metas');
  }

  protected fechar(): void {
    this.overlay.set('none');
  }

  // ---- mutações no dia ----
  private async patchDia(fn: (d: DiaDieta) => void): Promise<void> {
    const atual = this.dia();
    if (!atual) return;
    const copia: DiaDieta = JSON.parse(JSON.stringify(atual));
    fn(copia);
    this.dia.set(copia);
    await this.svc.salvarDia(copia);
  }

  protected async confirmarLib(): Promise<void> {
    const a = this.alimentoSel();
    const refId = this.refeicaoAlvo();
    if (!a || !refId) return;
    const item = this.svc.criarItem(a, this.quantidade);
    await this.patchDia((d) => {
      d.refeicoes.find((r) => r.id === refId)?.itens.push(item);
    });
    this.fechar();
  }

  protected async confirmarNovo(): Promise<void> {
    const refId = this.refeicaoAlvo();
    const nome = this.novo.nome.trim();
    if (!nome || !refId) return;
    const alimento = this.svc.novoAlimento({
      nome,
      porcao: this.novo.porcao.trim() || '1 porção',
      kcal: Number(this.novo.kcal) || 0,
      proteina: Number(this.novo.proteina) || 0,
      carbo: Number(this.novo.carbo) || 0,
      gordura: Number(this.novo.gordura) || 0,
    });
    await this.svc.salvarAlimento(alimento);
    this.alimentos.set([...this.alimentos(), alimento].sort((x, y) => x.nome.localeCompare(y.nome)));
    const item = this.svc.criarItem(alimento, this.quantidade);
    await this.patchDia((d) => {
      d.refeicoes.find((r) => r.id === refId)?.itens.push(item);
    });
    this.fechar();
  }

  protected async removerItem(refId: string, itemId: string): Promise<void> {
    await this.patchDia((d) => {
      const r = d.refeicoes.find((x) => x.id === refId);
      if (r) r.itens = r.itens.filter((i) => i.id !== itemId);
    });
  }

  protected async adicionarRefeicao(): Promise<void> {
    const nome = prompt('Nome da refeição:');
    if (!nome || !nome.trim()) return;
    await this.patchDia((d) => {
      d.refeicoes.push({ id: crypto.randomUUID(), nome: nome.trim(), itens: [] });
    });
  }

  protected async salvarMetas(): Promise<void> {
    const metas: MetasDieta = {
      id: 'metas-dieta',
      kcal: Number(this.metaForm.kcal) || 0,
      proteina: Number(this.metaForm.proteina) || 0,
      carbo: Number(this.metaForm.carbo) || 0,
      gordura: Number(this.metaForm.gordura) || 0,
    };
    await this.svc.salvarMetas(metas);
    this.metas.set(metas);
    this.fechar();
  }
}
