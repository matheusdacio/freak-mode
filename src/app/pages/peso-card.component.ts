import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetaPeso, ObjetivoPeso, RegistroPeso } from '@models/saude.model';
import { SaudeService } from '@services/saude.service';
import { PesoChartComponent } from '../shared/peso-chart.component';
import {
  dataDeDias,
  diasDesdeEpoca,
  hojeLocal,
  inicioSemana,
  labelCurta,
  labelRelativa,
} from '../shared/datas';

/** Sentido da variação em relação ao objetivo: a favor, contra ou indiferente. */
type Classe = 'bom' | 'ruim' | 'neutro';
type Visao = 'pesagens' | 'semanas';

interface Tile {
  titulo: string;
  valor: string;
  sub: string;
  classe: Classe;
}

interface LinhaPesagem {
  data: string;
  quando: string;
  peso: number;
  delta: string;
  classe: Classe;
}

interface LinhaSemana {
  inicio: number;
  label: string;
  media: number;
  n: number;
  delta: string;
  classe: Classe;
}

interface Periodo {
  dias: number | null;
  label: string;
}

interface Tendencia {
  gSemana: number;
  dias: number;
  n: number;
}

const PERIODOS: Periodo[] = [
  { dias: 30, label: '1M' },
  { dias: 90, label: '3M' },
  { dias: 180, label: '6M' },
  { dias: 365, label: '1A' },
  { dias: null, label: 'Tudo' },
];
const LIMITE_LISTA = 8;
const JANELA_TEND = 21;
const MIN_PESAGENS_TEND = 4;
const MIN_DIAS_TEND = 10;

@Component({
  selector: 'app-peso-card',
  imports: [FormsModule, PesoChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card anim-in">
      <div class="card-head">
        <h2>⚖️ Peso</h2>
        <button class="mini" (click)="alternarMeta()">{{ editandoMeta() ? 'cancelar' : labelMeta() }}</button>
      </div>

      @if (editandoMeta()) {
        <div class="meta-form">
          <label>
            Objetivo
            <select class="select" [(ngModel)]="metaForm.objetivo">
              <option value="ganhar">Ganhar peso</option>
              <option value="perder">Perder peso</option>
              <option value="manter">Manter o peso</option>
            </select>
          </label>
          <label>
            Peso alvo (kg)
            <input class="field" type="number" inputmode="decimal" placeholder="opcional" [(ngModel)]="metaForm.alvo" />
          </label>
          <button class="btn btn-primary" (click)="salvarMeta()">Salvar</button>
        </div>
      }

      @if (pesos().length === 0) {
        <p class="vazio-msg muted">Registre seu peso para começar a acompanhar.</p>
      } @else {
        <div class="atual-row">
          <div class="atual"><strong>{{ fmt(atual().peso) }}</strong><small>kg</small></div>
          <div class="atual-info">
            <span class="muted">{{ quandoAtual() }}</span>
            @if (faltaMeta(); as f) {
              <span [class]="'falta ' + f.classe">{{ f.texto }}</span>
            }
          </div>
        </div>

        <div class="resumo">
          @for (r of resumo(); track r.titulo) {
            <div class="tile">
              <span class="tile-titulo">{{ r.titulo }}</span>
              <span [class]="'tile-valor ' + r.classe">{{ r.valor }}</span>
              <span class="tile-sub muted">{{ r.sub }}</span>
            </div>
          }
        </div>

        @if (pesos().length >= 2) {
          @if (periodos().length > 1) {
            <div class="periodos">
              @for (p of periodos(); track p.label) {
                <button class="periodo" [class.ativo]="periodoEfetivo() === p.dias" (click)="periodo.set(p.dias)">
                  {{ p.label }}
                </button>
              }
            </div>
          }
          <app-peso-chart [pesos]="pesos()" [dias]="periodoEfetivo()" [alvo]="meta().alvo ?? null" />
          <div class="legenda muted">
            <span class="leg leg--bruto">Pesagem</span>
            <span class="leg leg--media">Média de 7 dias</span>
            @if (meta().alvo) {
              <span class="leg leg--meta">Meta</span>
            }
          </div>
          <p class="tendencia">
            @if (tendencia(); as t) {
              <span [class]="'tend-valor ' + classeDelta(t.gSemana)">{{ sinal(t.gSemana) }}{{ abs(t.gSemana) }} g/semana</span>
              <span class="muted">tendência dos últimos {{ t.dias }} dias ({{ t.n }} pesagens)</span>
            } @else {
              <span class="muted">{{ motivoSemTendencia() }}</span>
            }
          </p>
        }

        <div class="hist-head">
          <h3>HISTÓRICO <span class="muted">{{ pesos().length }}</span></h3>
          <div class="seg">
            <button [class.ativo]="visao() === 'pesagens'" (click)="mudarVisao('pesagens')">Pesagens</button>
            <button [class.ativo]="visao() === 'semanas'" (click)="mudarVisao('semanas')">Semanas</button>
          </div>
        </div>

        <ul class="lista">
          @if (visao() === 'pesagens') {
            @for (l of linhasPesagens(); track l.data) {
              <li class="linha">
                <span class="linha-data">{{ l.quando }}</span>
                @if (editandoData() === l.data) {
                  <input
                    class="linha-input"
                    type="number"
                    inputmode="decimal"
                    [(ngModel)]="editInput"
                    (keyup.enter)="confirmarEdicao(l.data)"
                  />
                  <button class="acao acao--ok" title="Salvar" (click)="confirmarEdicao(l.data)">✓</button>
                  <button class="acao" title="Cancelar" (click)="editandoData.set(null)">✕</button>
                } @else {
                  <span class="linha-peso">{{ fmt(l.peso) }}<small>kg</small></span>
                  <span [class]="'linha-delta ' + l.classe">{{ l.delta }}</span>
                  <button class="acao" title="Editar" (click)="editar(l.data, l.peso)">✎</button>
                  <button class="acao" title="Excluir" (click)="excluir(l.data)">🗑</button>
                }
              </li>
            }
          } @else {
            @for (s of linhasSemanas(); track s.inicio) {
              <li class="linha">
                <span class="linha-data">{{ s.label }}</span>
                <span class="linha-peso">{{ fmt(s.media) }}<small>kg</small></span>
                <span [class]="'linha-delta ' + s.classe">{{ s.delta }}</span>
                <span class="linha-n muted">{{ s.n }} {{ s.n === 1 ? 'pesagem' : 'pesagens' }}</span>
              </li>
            }
          }
        </ul>
        @if (totalVisao() > limite) {
          <button class="ver-todas" (click)="todas.set(!todas())">
            {{ todas() ? 'ver menos' : 'ver tudo (' + totalVisao() + ')' }}
          </button>
        }
      }

      <div class="registrar">
        <input class="field data" type="date" [max]="hoje" [(ngModel)]="dataInput" />
        <input
          class="field peso"
          type="number"
          inputmode="decimal"
          placeholder="Peso (kg)"
          [(ngModel)]="pesoInput"
          (keyup.enter)="registrar()"
        />
        <button class="btn btn-primary" [disabled]="!pesoInput" (click)="registrar()">Salvar</button>
      </div>
    </section>
  `,
  styles: [
    `
      .card { background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; margin-bottom: 0.9rem; }
      .card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.7rem; }
      h2 { font-family: var(--font-display); font-size: 1.3rem; text-transform: uppercase; }
      .mini { font-size: 0.74rem; font-weight: 700; color: var(--accent-2); border: 1px solid var(--accent-dim); background: var(--accent-soft); border-radius: 999px; padding: 0.3rem 0.7rem; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .bom { color: var(--ok); }
      .ruim { color: var(--danger); }
      .neutro { color: var(--accent-2); }

      .meta-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; align-items: end; margin-bottom: 0.9rem; padding-bottom: 0.9rem; border-bottom: 1px solid var(--line); }
      .meta-form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
      .meta-form .btn { grid-column: 1 / -1; }
      .select { width: 100%; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.85rem 0.7rem; font-size: 0.95rem; color: var(--text); }

      .atual-row { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 0.8rem; }
      .atual { font-family: var(--font-display); font-size: 2.6rem; line-height: 1; display: flex; align-items: baseline; gap: 0.3rem; }
      .atual small { font-size: 0.8rem; color: var(--muted); font-family: var(--font-body); }
      .atual-info { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.78rem; line-height: 1.3; }
      .falta { font-weight: 700; }

      .resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.9rem; }
      .tile { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.55rem 0.6rem; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
      .tile-titulo { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 700; }
      .tile-valor { font-family: var(--font-display); font-size: 1.15rem; line-height: 1.1; white-space: nowrap; }
      .tile-sub { font-size: 0.64rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .periodos { display: flex; gap: 0.3rem; margin-bottom: 0.4rem; }
      .periodo { flex: 1; padding: 0.35rem 0; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; color: var(--muted); border: 1px solid var(--line); background: var(--bg); }
      .periodo.ativo { color: #fff; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%); border-color: transparent; }

      app-peso-chart { margin: 0.2rem 0 0.3rem; }
      .legenda { display: flex; gap: 0.9rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-top: 0.4rem; }
      .leg { display: inline-flex; align-items: center; gap: 0.3rem; }
      .leg::before { content: ''; width: 14px; height: 0; border-top-width: 2px; border-top-style: solid; }
      .leg--bruto::before { border-top-color: var(--accent); }
      .leg--media::before { border-top-color: var(--accent-2); }
      .leg--meta::before { border-top-color: var(--ok); border-top-style: dashed; }

      .tendencia { display: flex; align-items: baseline; gap: 0.45rem; flex-wrap: wrap; margin: 0.7rem 0 0.2rem; padding-top: 0.7rem; border-top: 1px solid var(--line); font-size: 0.72rem; line-height: 1.4; }
      .tend-valor { font-family: var(--font-display); font-size: 1.15rem; }

      .hist-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin: 1rem 0 0.5rem; }
      h3 { font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
      h3 .muted { letter-spacing: 0; margin-left: 0.3rem; }
      .seg { display: flex; gap: 0.2rem; background: var(--bg); border: 1px solid var(--line); border-radius: 999px; padding: 0.2rem; }
      .seg button { padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; color: var(--muted); }
      .seg button.ativo { background: var(--surface-2); color: var(--text); }

      .lista { list-style: none; border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
      .linha { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.7rem; background: var(--bg); font-size: 0.85rem; }
      .linha + .linha { border-top: 1px solid var(--line); }
      .linha-data { flex: 1; min-width: 0; color: var(--muted); font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .linha-peso { font-family: var(--font-display); font-size: 1.05rem; display: flex; align-items: baseline; gap: 0.2rem; }
      .linha-peso small { font-size: 0.6rem; color: var(--muted); font-family: var(--font-body); }
      .linha-delta { font-size: 0.75rem; font-weight: 700; min-width: 3rem; text-align: right; }
      .linha-n { font-size: 0.68rem; white-space: nowrap; }
      .linha-input { width: 5.2rem; background: var(--surface-2); border: 1px solid var(--accent); border-radius: var(--radius-sm); padding: 0.4rem 0.5rem; font-size: 1rem; font-weight: 700; text-align: center; outline: none; }
      .acao { padding: 0.2rem 0.35rem; font-size: 0.9rem; opacity: 0.7; }
      .acao:active { opacity: 1; }
      .acao--ok { color: var(--ok); opacity: 1; }
      .ver-todas { display: block; margin: 0.5rem auto 0; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; color: var(--accent-2); padding: 0.3rem 0.6rem; }

      .registrar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.9rem; }
      .registrar .data { flex: 1 1 8.5rem; color-scheme: dark; }
      .registrar .peso { flex: 1 1 6rem; }
      .registrar .btn { flex: 1 0 auto; }
      .vazio-msg { font-size: 0.85rem; line-height: 1.5; padding: 0.5rem 0 0.8rem; }
    `,
  ],
})
export class PesoCardComponent implements OnInit {
  private readonly svc = inject(SaudeService);

  protected readonly hoje = hojeLocal();
  protected readonly limite = LIMITE_LISTA;

  protected readonly pesos = signal<RegistroPeso[]>([]);
  protected readonly meta = signal<MetaPeso>({ id: 'meta-peso', objetivo: 'ganhar' });
  protected readonly editandoMeta = signal(false);
  protected readonly periodo = signal<number | null>(90);
  protected readonly visao = signal<Visao>('pesagens');
  protected readonly todas = signal(false);
  protected readonly editandoData = signal<string | null>(null);

  protected pesoInput: number | null = null;
  protected dataInput = this.hoje;
  protected editInput: number | null = null;
  protected metaForm: { objetivo: ObjetivoPeso; alvo: number | null } = { objetivo: 'ganhar', alvo: null };

  async ngOnInit(): Promise<void> {
    const [pesos, meta] = await Promise.all([this.svc.listarPesos(), this.svc.obterMetaPeso()]);
    this.pesos.set(pesos);
    this.meta.set(meta);
  }

  private async recarregar(): Promise<void> {
    this.pesos.set(await this.svc.listarPesos());
  }

  // ---- formatação ----
  protected fmt(n: number, casas = 1): string {
    return n.toFixed(casas).replace('.', ',');
  }
  protected sinal(n: number): string {
    return n > 0 ? '+' : n < 0 ? '−' : '';
  }
  protected abs(n: number): number {
    return Math.abs(n);
  }
  private fmtDelta(d: number, unidade = ' kg'): string {
    return `${this.sinal(d)}${this.fmt(Math.abs(d))}${unidade}`;
  }
  private arred(n: number): number {
    return Math.round(n * 10) / 10;
  }

  /** Subir é bom em ganho, ruim em perda; em manutenção nenhuma direção é melhor. */
  protected classeDelta(d: number): Classe {
    if (d === 0) return 'neutro';
    const objetivo = this.meta().objetivo;
    if (objetivo === 'manter') return 'neutro';
    const aFavor = objetivo === 'ganhar' ? d > 0 : d < 0;
    return aFavor ? 'bom' : 'ruim';
  }

  // ---- atual e meta ----
  protected readonly atual = computed<RegistroPeso>(
    () => this.pesos().at(-1) ?? { id: this.hoje, data: this.hoje, peso: 0 },
  );

  protected readonly quandoAtual = computed(() => {
    const diff = diasDesdeEpoca(this.hoje) - diasDesdeEpoca(this.atual().data);
    if (diff === 0) return 'pesagem de hoje';
    if (diff === 1) return 'última pesagem ontem';
    if (diff < 7) return `última pesagem há ${diff} dias`;
    return `última pesagem em ${labelCurta(this.atual().data)}`;
  });

  protected readonly labelMeta = computed(() => {
    const m = this.meta();
    const objetivo = { ganhar: 'ganhar', perder: 'perder', manter: 'manter' }[m.objetivo];
    return m.alvo ? `${objetivo} · meta ${this.fmt(m.alvo)} kg` : `objetivo: ${objetivo}`;
  });

  protected readonly faltaMeta = computed<{ texto: string; classe: Classe } | null>(() => {
    const { alvo, objetivo } = this.meta();
    if (!alvo || this.pesos().length === 0) return null;
    const diff = this.arred(alvo - this.atual().peso);
    if (Math.abs(diff) < 0.05) return { texto: 'na meta 🎯', classe: 'bom' };
    if (objetivo === 'manter') {
      return { texto: `${this.fmtDelta(-diff)} em relação à meta de ${this.fmt(alvo)}`, classe: 'neutro' };
    }
    const faltando = objetivo === 'ganhar' ? diff > 0 : diff < 0;
    if (faltando) return { texto: `faltam ${this.fmt(Math.abs(diff))} kg para ${this.fmt(alvo)}`, classe: 'neutro' };
    return { texto: `${this.fmt(Math.abs(diff))} kg além da meta de ${this.fmt(alvo)}`, classe: 'bom' };
  });

  // ---- resumo ----
  /** Variação até a última pesagem em relação à pesagem mais recente com pelo menos N dias de distância. */
  private deltaDesde(diasAtras: number): { delta: number; ref: RegistroPeso } | null {
    const ps = this.pesos();
    const a = ps.at(-1);
    if (!a) return null;
    const limite = diasDesdeEpoca(a.data) - diasAtras;
    const ref = [...ps].reverse().find((p) => diasDesdeEpoca(p.data) <= limite);
    return ref ? { delta: this.arred(a.peso - ref.peso), ref } : null;
  }

  protected readonly resumo = computed<Tile[]>(() => {
    const ps = this.pesos();
    if (ps.length === 0) return [];
    const tiles: Tile[] = [];
    for (const [titulo, dias] of [
      ['7 dias', 7],
      ['30 dias', 30],
    ] as const) {
      const d = this.deltaDesde(dias);
      tiles.push(
        d
          ? { titulo, valor: this.fmtDelta(d.delta), sub: `vs ${labelCurta(d.ref.data)}`, classe: this.classeDelta(d.delta) }
          : { titulo, valor: '–', sub: 'sem pesagem antes', classe: 'neutro' },
      );
    }
    const primeiro = ps[0];
    const total = this.arred(ps[ps.length - 1].peso - primeiro.peso);
    tiles.push(
      ps.length >= 2
        ? { titulo: 'Total', valor: this.fmtDelta(total), sub: `desde ${labelCurta(primeiro.data)}`, classe: this.classeDelta(total) }
        : { titulo: 'Total', valor: '–', sub: 'primeira pesagem', classe: 'neutro' },
    );
    return tiles;
  });

  // ---- período do gráfico ----
  /** Só oferece janelas que mudam o gráfico: com pelo menos 2 pesagens dentro e alguma fora. */
  protected readonly periodos = computed<Periodo[]>(() => {
    const dias = this.pesos().map((p) => diasDesdeEpoca(p.data));
    const hojeD = diasDesdeEpoca(this.hoje);
    return PERIODOS.filter((p) => {
      if (p.dias === null) return true;
      const dentro = dias.filter((d) => d >= hojeD - p.dias!).length;
      return dentro >= 2 && dentro < dias.length;
    });
  });

  protected readonly periodoEfetivo = computed(() =>
    this.periodos().some((p) => p.dias === this.periodo()) ? this.periodo() : null,
  );

  // ---- tendência (regressão linear sobre a janela, para uma pesagem fora da curva não mandar) ----
  private readonly janelaTend = computed<RegistroPeso[]>(() => {
    const ps = this.pesos();
    if (ps.length === 0) return [];
    const fim = diasDesdeEpoca(ps[ps.length - 1].data);
    return ps.filter((p) => fim - diasDesdeEpoca(p.data) < JANELA_TEND);
  });

  protected readonly tendencia = computed<Tendencia | null>(() => {
    const j = this.janelaTend();
    if (j.length < MIN_PESAGENS_TEND) return null;
    const x0 = diasDesdeEpoca(j[0].data);
    const dias = diasDesdeEpoca(j[j.length - 1].data) - x0 + 1;
    if (dias < MIN_DIAS_TEND) return null;
    const xs = j.map((p) => diasDesdeEpoca(p.data) - x0);
    const ys = j.map((p) => p.peso);
    const n = j.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
    if (den === 0) return null;
    // kg/dia -> g/semana
    return { gSemana: Math.round((num / den) * 7 * 1000), dias, n };
  });

  protected readonly motivoSemTendencia = computed(() => {
    const faltam = MIN_PESAGENS_TEND - this.janelaTend().length;
    if (faltam > 0) {
      return `Faltam ${faltam} ${faltam === 1 ? 'pesagem' : 'pesagens'} nos últimos ${JANELA_TEND} dias para calcular a tendência.`;
    }
    return `Pesagens concentradas em poucos dias. A tendência precisa de pelo menos ${MIN_DIAS_TEND} dias de intervalo.`;
  });

  // ---- histórico ----
  private readonly todasLinhasPesagens = computed<LinhaPesagem[]>(() => {
    const ps = this.pesos();
    return ps
      .map((p, i) => {
        const d = i > 0 ? this.arred(p.peso - ps[i - 1].peso) : null;
        return {
          data: p.data,
          quando: labelRelativa(p.data, this.hoje),
          peso: p.peso,
          delta: d === null ? 'primeira' : this.fmtDelta(d, ''),
          classe: d === null ? 'neutro' : this.classeDelta(d),
        } satisfies LinhaPesagem;
      })
      .reverse();
  });

  private readonly todasLinhasSemanas = computed<LinhaSemana[]>(() => {
    const grupos = new Map<number, number[]>();
    for (const p of this.pesos()) {
      const k = inicioSemana(diasDesdeEpoca(p.data));
      grupos.set(k, [...(grupos.get(k) ?? []), p.peso]);
    }
    const semanaAtual = inicioSemana(diasDesdeEpoca(this.hoje));
    const linhas: LinhaSemana[] = [];
    let anterior: number | null = null;
    for (const [inicio, valores] of [...grupos.entries()].sort((a, b) => a[0] - b[0])) {
      const media = this.arred(valores.reduce((a, b) => a + b, 0) / valores.length);
      const d = anterior === null ? null : this.arred(media - anterior);
      const label =
        inicio === semanaAtual
          ? 'esta semana'
          : inicio === semanaAtual - 7
            ? 'semana passada'
            : `${labelCurta(dataDeDias(inicio))} a ${labelCurta(dataDeDias(inicio + 6))}`;
      linhas.push({
        inicio,
        label,
        media,
        n: valores.length,
        delta: d === null ? 'primeira' : this.fmtDelta(d, ''),
        classe: d === null ? 'neutro' : this.classeDelta(d),
      });
      anterior = media;
    }
    return linhas.reverse();
  });

  protected readonly totalVisao = computed(() =>
    this.visao() === 'pesagens' ? this.todasLinhasPesagens().length : this.todasLinhasSemanas().length,
  );

  protected readonly linhasPesagens = computed(() =>
    this.todas() ? this.todasLinhasPesagens() : this.todasLinhasPesagens().slice(0, LIMITE_LISTA),
  );

  protected readonly linhasSemanas = computed(() =>
    this.todas() ? this.todasLinhasSemanas() : this.todasLinhasSemanas().slice(0, LIMITE_LISTA),
  );

  protected mudarVisao(v: Visao): void {
    this.visao.set(v);
    this.todas.set(false);
  }

  // ---- ações ----
  protected async registrar(): Promise<void> {
    const p = Number(this.pesoInput);
    if (!p || p <= 0) return;
    const data = this.dataInput && this.dataInput <= this.hoje ? this.dataInput : this.hoje;
    await this.svc.salvarPeso(this.arred(p), data);
    await this.recarregar();
    this.pesoInput = null;
    this.dataInput = this.hoje;
  }

  protected editar(data: string, peso: number): void {
    this.editInput = peso;
    this.editandoData.set(data);
  }

  protected async confirmarEdicao(data: string): Promise<void> {
    const p = Number(this.editInput);
    if (!p || p <= 0) return;
    await this.svc.salvarPeso(this.arred(p), data);
    await this.recarregar();
    this.editandoData.set(null);
  }

  protected async excluir(data: string): Promise<void> {
    if (!confirm(`Excluir a pesagem de ${labelCurta(data)}?`)) return;
    await this.svc.removerPeso(data);
    await this.recarregar();
  }

  protected alternarMeta(): void {
    if (!this.editandoMeta()) {
      const m = this.meta();
      this.metaForm = { objetivo: m.objetivo, alvo: m.alvo ?? null };
    }
    this.editandoMeta.set(!this.editandoMeta());
  }

  protected async salvarMeta(): Promise<void> {
    const alvo = Number(this.metaForm.alvo);
    const meta: MetaPeso = {
      id: 'meta-peso',
      objetivo: this.metaForm.objetivo,
      ...(alvo > 0 ? { alvo: this.arred(alvo) } : {}),
    };
    await this.svc.salvarMetaPeso(meta);
    this.meta.set(meta);
    this.editandoMeta.set(false);
  }
}
