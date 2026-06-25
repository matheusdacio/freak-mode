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
import {
  Alimento,
  DiaAdesao,
  DietaPlano,
  Macros,
  MetasDieta,
  Refeicao,
} from '@models/dieta.model';

type Overlay = 'none' | 'add' | 'metas';
type ModoAdd = 'lib' | 'novo';

@Component({
  selector: 'app-dieta',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <div class="topo-linha">
        <div>
          <p class="kicker">NUTRIÇÃO</p>
          <h1>MINHA DIETA</h1>
        </div>
        <div class="acoes-topo">
          <button class="btn-top" (click)="abrirMetas()" title="Metas">⚙️</button>
          <button class="btn-top" [class.ativo]="editando()" (click)="editando.set(!editando())">
            {{ editando() ? '✓ Concluir' : '✎ Editar' }}
          </button>
        </div>
      </div>
    </header>

    @if (plano(); as p) {
      @if (!editando()) {
        <div class="dia-nav anim-in">
          <button class="seta" (click)="mudarDia(-1)">‹</button>
          <span class="dia-label">{{ labelData() }}</span>
          <button class="seta" (click)="mudarDia(1)" [disabled]="ehHoje()">›</button>
        </div>
      }

      <!-- Dashboard de macros -->
      <section class="dash anim-in">
        <div class="ring-wrap">
          <svg viewBox="0 0 120 120" class="ring">
            <circle class="ring-bg" cx="60" cy="60" r="52" />
            <circle
              class="ring-fg"
              cx="60"
              cy="60"
              r="52"
              [attr.stroke-dasharray]="CIRC"
              [attr.stroke-dashoffset]="ringOffset()"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="ring-center">
            <span class="ring-num">{{ atual().kcal }}</span>
            <span class="ring-meta">/ {{ metas().kcal }}</span>
            <span class="ring-cap">kcal</span>
          </div>
        </div>
        <div class="barras">
          @for (b of barras(); track b.label) {
            <div class="barra">
              <div class="barra-top">
                <span class="barra-label">{{ b.label }}</span>
                <span class="barra-val"><strong>{{ b.atual }}</strong>/{{ b.meta }}{{ b.un }}</span>
              </div>
              <div class="trilha">
                <div
                  class="fill"
                  [class.fill--estourou]="b.atual > b.meta && b.meta > 0"
                  [style.width.%]="b.pct"
                ></div>
              </div>
            </div>
          }
        </div>
      </section>
      <p class="dash-cap muted">
        {{ editando() ? 'Total do plano fixo' : 'Consumido · ' + labelData().toLowerCase() }}
      </p>

      <!-- Refeições do plano -->
      @for (r of p.refeicoes; track r.id) {
        <section class="ref anim-in">
          <div class="ref-head">
            <h2>{{ r.nome }}</h2>
            @if (editando()) {
              <button class="ref-remover" (click)="removerRefeicao(r.id)">remover</button>
            } @else {
              <span class="ref-meta">
                {{ comidosNaRef(r) }}/{{ r.itens.length }} · {{ totalKcalRefeicao(r.id) }} kcal
              </span>
            }
          </div>

          @for (it of r.itens; track it.id) {
            <div class="item" [class.feito]="!editando() && estaComido(it.id)">
              @if (editando()) {
                <button class="item-x" (click)="removerItem(r.id, it.id)">✕</button>
              } @else {
                <button class="check" [class.on]="estaComido(it.id)" (click)="toggleComido(it.id)">
                  @if (estaComido(it.id)) {✓}
                </button>
              }
              <div class="item-info">
                <span class="item-nome">{{ it.nome }}</span>
                <span class="item-sub muted">
                  {{ it.quantidade }}× {{ it.porcao }} · {{ it.proteina }}P {{ it.carbo }}C {{ it.gordura }}G
                </span>
              </div>
              <span class="item-kcal">{{ it.kcal }}</span>
            </div>
          } @empty {
            <p class="ref-vazio muted">Sem alimentos nesta refeição.</p>
          }

          @if (editando()) {
            <button class="add-item" (click)="abrirAdd(r.id)">＋ Adicionar alimento</button>
          }
        </section>
      }

      @if (editando()) {
        <button class="btn btn-ghost nova-ref" (click)="adicionarRefeicao()">＋ Nova refeição</button>
      } @else if (semItens()) {
        <div class="vazio anim-in">
          <span class="vazio-emoji">🥗</span>
          <p class="muted">Seu plano está vazio.<br />Toque em <strong>✎ Editar</strong> pra montar sua dieta.</p>
        </div>
      }
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
          <input class="field" type="text" placeholder="Buscar alimento…" [(ngModel)]="busca" />
          <div class="lista-alim">
            @for (a of alimentosFiltrados(); track a.id) {
              <button class="alim" [class.sel]="alimentoSel()?.id === a.id" (click)="alimentoSel.set(a)">
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
        padding: 1.4rem 0 0.6rem;
      }
      .topo-linha {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .kicker {
        font-size: 0.66rem;
        letter-spacing: 0.35em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.1rem;
        line-height: 0.95;
        text-transform: uppercase;
        margin-top: 0.2rem;
      }
      .acoes-topo {
        display: flex;
        gap: 0.4rem;
        flex-shrink: 0;
      }
      .btn-top {
        font-size: 0.74rem;
        font-weight: 700;
        color: var(--muted);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.4rem 0.7rem;
        background: var(--surface);
        white-space: nowrap;
      }
      .btn-top.ativo {
        color: #fff;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        border-color: transparent;
      }

      .dia-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        margin: 0.3rem 0 1rem;
      }
      .seta {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--surface);
        border: 1px solid var(--line);
        font-size: 1.3rem;
        line-height: 1;
        color: var(--text);
      }
      .seta:disabled {
        opacity: 0.3;
      }
      .dia-label {
        font-family: var(--font-display);
        font-size: 1.1rem;
        text-transform: uppercase;
        min-width: 4.5rem;
        text-align: center;
      }

      /* ---- dashboard ---- */
      .dash {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1rem;
      }
      .ring-wrap {
        position: relative;
        width: 110px;
        height: 110px;
        flex-shrink: 0;
      }
      .ring {
        width: 110px;
        height: 110px;
        transform: rotate(0);
      }
      .ring-bg {
        fill: none;
        stroke: var(--bg);
        stroke-width: 11;
      }
      .ring-fg {
        fill: none;
        stroke: var(--accent);
        stroke-width: 11;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.4s ease;
        filter: drop-shadow(0 0 5px var(--accent-glow));
      }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
      }
      .ring-num {
        font-family: var(--font-display);
        font-size: 1.7rem;
        line-height: 1;
      }
      .ring-meta {
        font-size: 0.72rem;
        color: var(--muted);
      }
      .ring-cap {
        font-size: 0.6rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--accent-2);
        font-weight: 700;
        margin-top: 0.15rem;
      }
      .barras {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .barra-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 0.78rem;
        margin-bottom: 0.25rem;
      }
      .barra-label {
        font-weight: 600;
      }
      .barra-val strong {
        font-family: var(--font-display);
        font-size: 0.95rem;
      }
      .trilha {
        height: 6px;
        border-radius: 999px;
        background: var(--bg);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent-dim) 0%, var(--accent) 100%);
        transition: width 0.3s ease;
      }
      .fill--estourou {
        background: linear-gradient(90deg, #b8860b 0%, var(--danger) 100%);
      }
      .dash-cap {
        text-align: center;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0.5rem 0 1.1rem;
      }

      /* ---- refeições ---- */
      .ref {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 0.85rem 0.95rem;
        margin-bottom: 0.7rem;
      }
      .ref-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
      }
      h2 {
        font-family: var(--font-display);
        font-size: 1.15rem;
        text-transform: uppercase;
      }
      .ref-meta {
        font-size: 0.74rem;
        color: var(--accent-2);
        font-weight: 700;
        white-space: nowrap;
      }
      .ref-remover {
        font-size: 0.72rem;
        color: var(--danger);
        font-weight: 700;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0;
        border-top: 1px solid var(--line);
      }
      .item.feito {
        opacity: 0.55;
      }
      .check {
        width: 1.5rem;
        height: 1.5rem;
        flex-shrink: 0;
        border-radius: 999px;
        border: 2px solid var(--line-strong);
        color: #fff;
        font-size: 0.8rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .check.on {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        border-color: transparent;
        box-shadow: 0 0 10px -2px var(--accent-glow);
      }
      .item-x {
        width: 1.5rem;
        flex-shrink: 0;
        color: var(--muted);
        font-size: 0.8rem;
      }
      .item-x:active {
        color: var(--danger);
      }
      .item-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .item-nome {
        font-size: 0.92rem;
        font-weight: 600;
      }
      .item-sub {
        font-size: 0.7rem;
      }
      .item-kcal {
        font-weight: 700;
        font-size: 0.88rem;
        flex-shrink: 0;
      }
      .ref-vazio {
        font-size: 0.8rem;
        padding: 0.4rem 0;
      }
      .add-item {
        margin-top: 0.5rem;
        width: 100%;
        font-size: 0.82rem;
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
      .vazio {
        text-align: center;
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        align-items: center;
      }
      .vazio-emoji {
        font-size: 2.2rem;
      }
      .vazio p {
        line-height: 1.5;
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
        font-size: 0.66rem;
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
        font-size: 0.66rem;
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

  protected readonly CIRC = 2 * Math.PI * 52;

  protected readonly plano = signal<DietaPlano | undefined>(undefined);
  protected readonly metas = signal<MetasDieta>({
    id: 'metas-dieta',
    kcal: 2000,
    proteina: 150,
    carbo: 200,
    gordura: 60,
  });
  protected readonly alimentos = signal<Alimento[]>([]);
  protected readonly dataAtual = signal<string>('');
  protected readonly adesao = signal<DiaAdesao>({ id: '', data: '', comidos: [] });
  protected readonly editando = signal(false);

  protected readonly overlay = signal<Overlay>('none');
  protected readonly modoAdd = signal<ModoAdd>('lib');
  protected readonly refeicaoAlvo = signal<string | null>(null);
  protected readonly alimentoSel = signal<Alimento | undefined>(undefined);

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

  private readonly comidosSet = computed(() => new Set(this.adesao().comidos));

  protected readonly atual = computed<Macros>(() => {
    const p = this.plano();
    if (!p) return { kcal: 0, proteina: 0, carbo: 0, gordura: 0 };
    return this.editando()
      ? this.svc.macrosPlano(p)
      : this.svc.macrosComidos(p, this.adesao());
  });

  protected readonly ringOffset = computed(() => {
    const meta = this.metas().kcal;
    const pct = meta > 0 ? Math.min(1, this.atual().kcal / meta) : 0;
    return this.CIRC * (1 - pct);
  });

  protected readonly barras = computed(() => {
    const a = this.atual();
    const m = this.metas();
    return [
      { label: 'Proteína', un: 'g', atual: a.proteina, meta: m.proteina },
      { label: 'Carbo', un: 'g', atual: a.carbo, meta: m.carbo },
      { label: 'Gordura', un: 'g', atual: a.gordura, meta: m.gordura },
    ].map((x) => ({
      ...x,
      pct: x.meta > 0 ? Math.min(100, Math.round((x.atual / x.meta) * 100)) : 0,
    }));
  });

  protected readonly semItens = computed(() => {
    const p = this.plano();
    return !!p && p.refeicoes.every((r) => r.itens.length === 0);
  });

  async ngOnInit(): Promise<void> {
    this.metas.set(await this.svc.obterMetas());
    this.alimentos.set(await this.svc.listarAlimentos());
    this.plano.set(await this.svc.obterPlano());
    this.dataAtual.set(this.svc.hoje());
    this.adesao.set(await this.svc.obterAdesao(this.svc.hoje()));
  }

  // ---- dia / adesão ----
  protected ehHoje(): boolean {
    return this.dataAtual() === this.svc.hoje();
  }

  protected labelData(): string {
    const d = this.dataAtual();
    if (!d) return 'Hoje';
    if (d === this.svc.hoje()) return 'Hoje';
    if (d === this.addDias(this.svc.hoje(), -1)) return 'Ontem';
    const [, m, dd] = d.split('-');
    return `${dd}/${m}`;
  }

  protected async mudarDia(delta: number): Promise<void> {
    const nova = this.addDias(this.dataAtual(), delta);
    this.dataAtual.set(nova);
    this.adesao.set(await this.svc.obterAdesao(nova));
  }

  private addDias(data: string, delta: number): string {
    const [y, m, d] = data.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  protected estaComido(itemId: string): boolean {
    return this.comidosSet().has(itemId);
  }

  protected async toggleComido(itemId: string): Promise<void> {
    const a = this.adesao();
    const comidos = a.comidos.includes(itemId)
      ? a.comidos.filter((x) => x !== itemId)
      : [...a.comidos, itemId];
    const novo: DiaAdesao = { ...a, id: this.dataAtual(), data: this.dataAtual(), comidos };
    this.adesao.set(novo);
    await this.svc.salvarAdesao(novo);
  }

  protected comidosNaRef(r: Refeicao): number {
    const set = this.comidosSet();
    return r.itens.filter((i) => set.has(i.id)).length;
  }

  protected totalKcalRefeicao(refId: string): number {
    const r = this.plano()?.refeicoes.find((x) => x.id === refId);
    return r ? this.svc.totaisRefeicao(r).kcal : 0;
  }

  // ---- plano ----
  private async patchPlano(fn: (p: DietaPlano) => void): Promise<void> {
    const atual = this.plano();
    if (!atual) return;
    const copia: DietaPlano = JSON.parse(JSON.stringify(atual));
    fn(copia);
    this.plano.set(copia);
    await this.svc.salvarPlano(copia);
  }

  protected nomeRefeicaoAlvo(): string {
    const id = this.refeicaoAlvo();
    return this.plano()?.refeicoes.find((r) => r.id === id)?.nome ?? '';
  }

  protected alimentosFiltrados(): Alimento[] {
    const q = this.busca.trim().toLowerCase();
    const lista = this.alimentos();
    return q ? lista.filter((a) => a.nome.toLowerCase().includes(q)) : lista;
  }

  protected previewKcal(a: Alimento): number {
    return Math.round(a.kcal * (this.quantidade > 0 ? this.quantidade : 1));
  }

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
    this.metaForm = { kcal: m.kcal, proteina: m.proteina, carbo: m.carbo, gordura: m.gordura };
    this.overlay.set('metas');
  }

  protected fechar(): void {
    this.overlay.set('none');
  }

  protected async confirmarLib(): Promise<void> {
    const a = this.alimentoSel();
    const refId = this.refeicaoAlvo();
    if (!a || !refId) return;
    const item = this.svc.criarItem(a, this.quantidade);
    await this.patchPlano((p) => {
      p.refeicoes.find((r) => r.id === refId)?.itens.push(item);
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
    await this.patchPlano((p) => {
      p.refeicoes.find((r) => r.id === refId)?.itens.push(item);
    });
    this.fechar();
  }

  protected async removerItem(refId: string, itemId: string): Promise<void> {
    await this.patchPlano((p) => {
      const r = p.refeicoes.find((x) => x.id === refId);
      if (r) r.itens = r.itens.filter((i) => i.id !== itemId);
    });
  }

  protected async adicionarRefeicao(): Promise<void> {
    const nome = prompt('Nome da refeição:');
    if (!nome || !nome.trim()) return;
    await this.patchPlano((p) => {
      p.refeicoes.push({ id: crypto.randomUUID(), nome: nome.trim(), itens: [] });
    });
  }

  protected async removerRefeicao(refId: string): Promise<void> {
    await this.patchPlano((p) => {
      p.refeicoes = p.refeicoes.filter((r) => r.id !== refId);
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
