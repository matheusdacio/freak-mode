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
  Componente,
  DiaAdesao,
  DietaPlano,
  Macros,
  MetasDieta,
  OpcaoAlimento,
  RefeicaoPlano,
} from '@models/dieta.model';

type Overlay = 'none' | 'opcao' | 'metas';

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
      @if (p.refeicoes.length === 0) {
        <div class="vazio anim-in">
          <span class="vazio-emoji">🥗</span>
          <p class="muted">Seu plano está vazio.</p>
          <button class="btn btn-primary btn-block" (click)="importar()">
            Importar minha dieta (Dietbox)
          </button>
          <button class="btn btn-ghost btn-block" (click)="editando.set(true)">Montar do zero</button>
        </div>
      } @else {
        @if (!editando()) {
          <div class="dia-nav anim-in">
            <button class="seta" (click)="mudarDia(-1)">‹</button>
            <span class="dia-label">{{ labelData() }}</span>
            <button class="seta" (click)="mudarDia(1)" [disabled]="ehHoje()">›</button>
          </div>

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
                    <span class="barra-val"><strong>{{ b.atual }}</strong>/{{ b.meta }}g</span>
                  </div>
                  <div class="trilha">
                    <div class="fill" [class.fill--estourou]="b.atual > b.meta && b.meta > 0" [style.width.%]="b.pct"></div>
                  </div>
                </div>
              }
            </div>
          </section>
          <p class="dash-cap muted">Consumido · {{ labelData().toLowerCase() }}</p>
        }

        @for (r of p.refeicoes; track r.id) {
          <section class="ref anim-in">
            <div class="ref-head">
              <div class="ref-titulo">
                <h2>{{ r.nome }}</h2>
                @if (r.horario) { <span class="ref-hora">{{ r.horario }}</span> }
              </div>
              @if (editando()) {
                <button class="ref-remover" (click)="removerRefeicao(r.id)">remover</button>
              } @else {
                <span class="ref-kcal">{{ refKcal(r) }} kcal</span>
              }
            </div>

            @for (c of r.componentes; track c.id) {
              <div class="comp">
                <div class="comp-head">
                  <span class="comp-nome">{{ c.nome }}</span>
                  @if (editando()) {
                    <button class="comp-x" (click)="removerComponente(r.id, c.id)">✕</button>
                  } @else if (opcaoEscolhida(c) && !expandido(c.id)) {
                    <button class="trocar" (click)="expandir(c.id)">trocar</button>
                  }
                </div>

                @if (!editando()) {
                  @if (opcaoEscolhida(c); as sel) {
                    @if (!expandido(c.id)) {
                      <button class="op op--sel" (click)="escolher(c.id, sel.id)">
                        <span class="op-check on">✓</span>
                        <span class="op-info">
                          <span class="op-nome">{{ sel.nome }}</span>
                          <span class="op-sub muted">{{ sel.porcao }} · {{ sel.kcal }} kcal</span>
                        </span>
                      </button>
                    }
                  }
                  @if (!opcaoEscolhida(c) || expandido(c.id)) {
                    @for (o of c.opcoes; track o.id) {
                      <button class="op" [class.op--sel]="escolha(c.id) === o.id" (click)="escolher(c.id, o.id)">
                        <span class="op-check" [class.on]="escolha(c.id) === o.id">
                          @if (escolha(c.id) === o.id) {✓}
                        </span>
                        <span class="op-info">
                          <span class="op-nome">{{ o.nome }}</span>
                          <span class="op-sub muted">{{ o.porcao }} · {{ o.kcal }}kcal · {{ o.proteina }}P {{ o.carbo }}C {{ o.gordura }}G</span>
                        </span>
                      </button>
                    }
                  }
                } @else {
                  @for (o of c.opcoes; track o.id) {
                    <div class="op op--edit">
                      <button class="op-info" (click)="editarOpcao(r.id, c.id, o)">
                        <span class="op-nome">{{ o.nome }}</span>
                        <span class="op-sub muted">{{ o.porcao }} · {{ o.kcal }}kcal · {{ o.proteina }}P {{ o.carbo }}C {{ o.gordura }}G</span>
                      </button>
                      <button class="op-x" (click)="removerOpcao(r.id, c.id, o.id)">✕</button>
                    </div>
                  }
                  <button class="add-op" (click)="abrirNovaOpcao(r.id, c.id)">＋ opção</button>
                }
              </div>
            }

            @if (editando()) {
              <button class="add-comp" (click)="adicionarComponente(r.id)">＋ componente</button>
            }
          </section>
        }

        @if (editando()) {
          <button class="btn btn-ghost nova-ref" (click)="adicionarRefeicao()">＋ Nova refeição</button>
        }
      }
    } @else {
      <p class="muted carregando">Carregando…</p>
    }

    <!-- ===== Overlay: editar/criar opção ===== -->
    @if (overlay() === 'opcao') {
      <div class="backdrop" (click)="fechar()"></div>
      <div class="sheet anim-up">
        <div class="sheet-handle"></div>
        <h3>{{ opForm.id ? 'Editar opção' : 'Nova opção' }}</h3>
        <div class="form-novo">
          <input class="field" type="text" placeholder="Nome (ex: Pão integral)" [(ngModel)]="opForm.nome" />
          <input class="field" type="text" placeholder="Porção (ex: 2 fatias / 50g)" [(ngModel)]="opForm.porcao" />
          <div class="grid-macros">
            <label>Kcal<input class="field" type="number" inputmode="numeric" [(ngModel)]="opForm.kcal" /></label>
            <label>Prot (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="opForm.proteina" /></label>
            <label>Carbo (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="opForm.carbo" /></label>
            <label>Gord (g)<input class="field" type="number" inputmode="decimal" [(ngModel)]="opForm.gordura" /></label>
          </div>
          <button class="btn btn-primary btn-block" [disabled]="!opForm.nome.trim()" (click)="salvarOpcao()">
            Salvar
          </button>
        </div>
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
      .topo { padding: 1.4rem 0 0.6rem; }
      .topo-linha { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
      .kicker { font-size: 0.66rem; letter-spacing: 0.35em; color: var(--accent); font-weight: 700; }
      h1 { font-family: var(--font-display); font-size: 2.1rem; line-height: 0.95; text-transform: uppercase; margin-top: 0.2rem; }
      .acoes-topo { display: flex; gap: 0.4rem; flex-shrink: 0; }
      .btn-top { font-size: 0.74rem; font-weight: 700; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 0.4rem 0.7rem; background: var(--surface); white-space: nowrap; }
      .btn-top.ativo { color: #fff; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%); border-color: transparent; }

      .dia-nav { display: flex; align-items: center; justify-content: center; gap: 0.8rem; margin: 0.3rem 0 1rem; }
      .seta { width: 2rem; height: 2rem; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-size: 1.3rem; line-height: 1; color: var(--text); }
      .seta:disabled { opacity: 0.3; }
      .dia-label { font-family: var(--font-display); font-size: 1.1rem; text-transform: uppercase; min-width: 4.5rem; text-align: center; }

      .dash { display: flex; align-items: center; gap: 1rem; background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; }
      .ring-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
      .ring { width: 110px; height: 110px; }
      .ring-bg { fill: none; stroke: var(--bg); stroke-width: 11; }
      .ring-fg { fill: none; stroke: var(--accent); stroke-width: 11; stroke-linecap: round; transition: stroke-dashoffset 0.4s ease; filter: drop-shadow(0 0 5px var(--accent-glow)); }
      .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .ring-num { font-family: var(--font-display); font-size: 1.7rem; line-height: 1; }
      .ring-meta { font-size: 0.72rem; color: var(--muted); }
      .ring-cap { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-2); font-weight: 700; margin-top: 0.15rem; }
      .barras { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.55rem; }
      .barra-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.78rem; margin-bottom: 0.25rem; }
      .barra-label { font-weight: 600; }
      .barra-val strong { font-family: var(--font-display); font-size: 0.95rem; }
      .trilha { height: 6px; border-radius: 999px; background: var(--bg); overflow: hidden; }
      .fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent-dim) 0%, var(--accent) 100%); transition: width 0.3s ease; }
      .fill--estourou { background: linear-gradient(90deg, #b8860b 0%, var(--danger) 100%); }
      .dash-cap { text-align: center; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin: 0.5rem 0 1.1rem; }

      .ref { background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.85rem 0.95rem; margin-bottom: 0.7rem; }
      .ref-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
      .ref-titulo { display: flex; align-items: baseline; gap: 0.5rem; }
      h2 { font-family: var(--font-display); font-size: 1.15rem; text-transform: uppercase; }
      .ref-hora { font-size: 0.72rem; color: var(--muted); font-weight: 700; }
      .ref-kcal { font-size: 0.74rem; color: var(--accent-2); font-weight: 700; white-space: nowrap; }
      .ref-remover { font-size: 0.72rem; color: var(--danger); font-weight: 700; }

      .comp { padding: 0.5rem 0; border-top: 1px solid var(--line); }
      .comp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem; }
      .comp-nome { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; color: var(--accent-2); }
      .trocar { font-size: 0.7rem; font-weight: 700; color: var(--muted); }
      .trocar:active { color: var(--accent-2); }
      .comp-x { font-size: 0.78rem; color: var(--muted); }

      .op { display: flex; align-items: center; gap: 0.55rem; width: 100%; text-align: left; padding: 0.4rem 0.2rem; border-radius: var(--radius-sm); }
      .op--sel { background: var(--accent-soft); }
      .op-check { width: 1.35rem; height: 1.35rem; flex-shrink: 0; border-radius: 999px; border: 2px solid var(--line-strong); color: #fff; font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
      .op-check.on { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%); border-color: transparent; }
      .op-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .op-nome { font-size: 0.9rem; font-weight: 600; }
      .op-sub { font-size: 0.7rem; }
      .op--edit { display: flex; align-items: center; gap: 0.4rem; }
      .op-x { color: var(--muted); font-size: 0.78rem; flex-shrink: 0; padding: 0.2rem; }
      .op-x:active { color: var(--danger); }
      .add-op { font-size: 0.78rem; font-weight: 600; color: var(--accent-2); padding: 0.35rem 0.2rem; }
      .add-comp { margin-top: 0.4rem; font-size: 0.78rem; font-weight: 700; color: var(--muted); border: 1px dashed var(--line-strong); border-radius: var(--radius-sm); padding: 0.4rem; width: 100%; }
      .nova-ref { width: 100%; margin: 0.2rem 0 1rem; }

      .vazio { text-align: center; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.7rem; align-items: center; }
      .vazio-emoji { font-size: 2.2rem; }
      .vazio .btn { width: 100%; }
      .carregando { text-align: center; padding: 2rem; }

      .backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px); z-index: 60; }
      .sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 61; max-width: 560px; margin: 0 auto; background: var(--surface); border: 1px solid var(--line-strong); border-bottom: none; border-radius: 20px 20px 0 0; padding: 0.6rem 1.1rem calc(1.1rem + env(safe-area-inset-bottom)); max-height: 86vh; overflow-y: auto; }
      .sheet-handle { width: 40px; height: 4px; border-radius: 999px; background: var(--line-strong); margin: 0.3rem auto 0.8rem; }
      .sheet h3 { font-family: var(--font-display); font-size: 1.4rem; text-transform: uppercase; margin-bottom: 0.8rem; }
      .form-novo { display: flex; flex-direction: column; gap: 0.6rem; }
      .grid-macros { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
      .grid-macros label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
      .fechar-sheet { margin-top: 0.6rem; color: var(--muted); }
    `,
  ],
})
export class DietaComponent implements OnInit {
  private readonly svc = inject(DietaService);

  protected readonly CIRC = 2 * Math.PI * 52;

  protected readonly plano = signal<DietaPlano | undefined>(undefined);
  protected readonly metas = signal<MetasDieta>({
    id: 'metas-dieta', kcal: 2000, proteina: 150, carbo: 200, gordura: 60,
  });
  protected readonly dataAtual = signal<string>('');
  protected readonly adesao = signal<DiaAdesao>({ id: '', data: '', escolhas: {} });
  protected readonly editando = signal(false);
  protected readonly expandidos = signal<Set<string>>(new Set());

  protected readonly overlay = signal<Overlay>('none');
  private editCtx: { refId: string; compId: string } = { refId: '', compId: '' };
  protected opForm = {
    id: '' as string,
    nome: '',
    porcao: '',
    kcal: null as number | null,
    proteina: null as number | null,
    carbo: null as number | null,
    gordura: null as number | null,
  };
  protected metaForm = { kcal: 0, proteina: 0, carbo: 0, gordura: 0 };

  protected readonly atual = computed<Macros>(() => {
    const p = this.plano();
    if (!p) return { kcal: 0, proteina: 0, carbo: 0, gordura: 0 };
    return this.svc.macrosEscolhidos(p, this.adesao());
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
      { label: 'Proteína', atual: a.proteina, meta: m.proteina },
      { label: 'Carbo', atual: a.carbo, meta: m.carbo },
      { label: 'Gordura', atual: a.gordura, meta: m.gordura },
    ].map((x) => ({ ...x, pct: x.meta > 0 ? Math.min(100, Math.round((x.atual / x.meta) * 100)) : 0 }));
  });

  async ngOnInit(): Promise<void> {
    this.metas.set(await this.svc.obterMetas());
    this.plano.set(await this.svc.obterPlano());
    this.dataAtual.set(this.svc.hoje());
    this.adesao.set(await this.svc.obterAdesao(this.svc.hoje()));
  }

  protected async importar(): Promise<void> {
    this.plano.set(await this.svc.importarPlanoMatheus());
  }

  // ---- dia ----
  protected ehHoje(): boolean { return this.dataAtual() === this.svc.hoje(); }
  protected labelData(): string {
    const d = this.dataAtual();
    if (!d || d === this.svc.hoje()) return 'Hoje';
    if (d === this.addDias(this.svc.hoje(), -1)) return 'Ontem';
    const [, m, dd] = d.split('-');
    return `${dd}/${m}`;
  }
  protected async mudarDia(delta: number): Promise<void> {
    const nova = this.addDias(this.dataAtual(), delta);
    this.dataAtual.set(nova);
    this.expandidos.set(new Set());
    this.adesao.set(await this.svc.obterAdesao(nova));
  }
  private addDias(data: string, delta: number): string {
    const [y, m, d] = data.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  // ---- escolhas (check do dia) ----
  protected escolha(compId: string): string | undefined {
    return this.adesao().escolhas[compId];
  }
  protected opcaoEscolhida(c: Componente): OpcaoAlimento | undefined {
    const id = this.adesao().escolhas[c.id];
    return id ? c.opcoes.find((o) => o.id === id) : undefined;
  }
  protected expandido(compId: string): boolean {
    return this.expandidos().has(compId);
  }
  protected expandir(compId: string): void {
    const s = new Set(this.expandidos());
    s.add(compId);
    this.expandidos.set(s);
  }
  protected async escolher(compId: string, opId: string): Promise<void> {
    const a = this.adesao();
    const escolhas = { ...a.escolhas };
    if (escolhas[compId] === opId) delete escolhas[compId];
    else escolhas[compId] = opId;
    const novo: DiaAdesao = { id: this.dataAtual(), data: this.dataAtual(), escolhas };
    this.adesao.set(novo);
    const s = new Set(this.expandidos());
    s.delete(compId);
    this.expandidos.set(s);
    await this.svc.salvarAdesao(novo);
  }
  protected refKcal(r: RefeicaoPlano): number {
    return this.svc.macrosRefeicao(r, this.adesao()).kcal;
  }

  // ---- editar plano ----
  private async patchPlano(fn: (p: DietaPlano) => void): Promise<void> {
    const atual = this.plano();
    if (!atual) return;
    const copia: DietaPlano = JSON.parse(JSON.stringify(atual));
    fn(copia);
    this.plano.set(copia);
    await this.svc.salvarPlano(copia);
  }

  protected abrirNovaOpcao(refId: string, compId: string): void {
    this.editCtx = { refId, compId };
    this.opForm = { id: '', nome: '', porcao: '', kcal: null, proteina: null, carbo: null, gordura: null };
    this.overlay.set('opcao');
  }
  protected editarOpcao(refId: string, compId: string, o: OpcaoAlimento): void {
    this.editCtx = { refId, compId };
    this.opForm = { id: o.id, nome: o.nome, porcao: o.porcao, kcal: o.kcal, proteina: o.proteina, carbo: o.carbo, gordura: o.gordura };
    this.overlay.set('opcao');
  }
  protected async salvarOpcao(): Promise<void> {
    const nome = this.opForm.nome.trim();
    if (!nome) return;
    const { refId, compId } = this.editCtx;
    const dados = {
      nome,
      porcao: this.opForm.porcao.trim() || '1 porção',
      kcal: Number(this.opForm.kcal) || 0,
      proteina: Number(this.opForm.proteina) || 0,
      carbo: Number(this.opForm.carbo) || 0,
      gordura: Number(this.opForm.gordura) || 0,
    };
    const idEdit = this.opForm.id;
    await this.patchPlano((p) => {
      const c = p.refeicoes.find((r) => r.id === refId)?.componentes.find((x) => x.id === compId);
      if (!c) return;
      if (idEdit) {
        const o = c.opcoes.find((x) => x.id === idEdit);
        if (o) Object.assign(o, dados);
      } else {
        c.opcoes.push(this.svc.novaOpcao(dados));
      }
    });
    this.fechar();
  }
  protected async removerOpcao(refId: string, compId: string, opId: string): Promise<void> {
    await this.patchPlano((p) => {
      const c = p.refeicoes.find((r) => r.id === refId)?.componentes.find((x) => x.id === compId);
      if (c) c.opcoes = c.opcoes.filter((o) => o.id !== opId);
    });
  }
  protected async adicionarComponente(refId: string): Promise<void> {
    const nome = prompt('Nome do componente (ex: Carboidrato):');
    if (!nome || !nome.trim()) return;
    await this.patchPlano((p) => {
      p.refeicoes.find((r) => r.id === refId)?.componentes.push(this.svc.novoComponente(nome.trim()));
    });
  }
  protected async removerComponente(refId: string, compId: string): Promise<void> {
    await this.patchPlano((p) => {
      const r = p.refeicoes.find((x) => x.id === refId);
      if (r) r.componentes = r.componentes.filter((c) => c.id !== compId);
    });
  }
  protected async adicionarRefeicao(): Promise<void> {
    const nome = prompt('Nome da refeição:');
    if (!nome || !nome.trim()) return;
    const horario = prompt('Horário (opcional, ex: 06:30):') || undefined;
    await this.patchPlano((p) => {
      p.refeicoes.push(this.svc.novaRefeicao(nome.trim(), horario?.trim() || undefined));
    });
  }
  protected async removerRefeicao(refId: string): Promise<void> {
    await this.patchPlano((p) => {
      p.refeicoes = p.refeicoes.filter((r) => r.id !== refId);
    });
  }

  // ---- metas ----
  protected abrirMetas(): void {
    const m = this.metas();
    this.metaForm = { kcal: m.kcal, proteina: m.proteina, carbo: m.carbo, gordura: m.gordura };
    this.overlay.set('metas');
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

  protected fechar(): void {
    this.overlay.set('none');
  }
}
