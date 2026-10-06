import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RegistroPeso } from '@models/saude.model';
import { dataDeDias, diaSemana, diasDesdeEpoca, hojeLocal, labelCurta } from './datas';

interface Ponto {
  x: number;
  y: number;
  dia: number;
  data: string;
  peso: number;
  media: number | null;
}

interface TickY {
  valor: number;
  y: number;
  label: string;
}

interface TickX {
  x: number;
  label: string;
  ancora: 'start' | 'middle' | 'end';
}

const LARGURA = 360;
const ALTURA = 200;
const PAD = { top: 22, right: 16, bottom: 26, left: 42 };
/** Dias de calendário da média móvel (pesagens são esparsas, por isso dias e não registros). */
const JANELA_MEDIA = 7;

/**
 * Gráfico de peso corporal com eixo de tempo real: o espaço entre pontos é proporcional
 * aos dias entre as pesagens, e o eixo vai até hoje para o intervalo desde a última
 * pesagem ficar visível. Mostra a pesagem bruta, a média de 7 dias e a meta.
 */
@Component({
  selector: 'app-peso-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="viewBox"
      class="grafico"
      (pointerdown)="apontar($event)"
      (pointermove)="apontar($event)"
      (pointerleave)="sair($event)"
    >
      <defs>
        <linearGradient id="pesoFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>

      @for (t of ticksY(); track t.valor) {
        <line [attr.x1]="pad.left" [attr.x2]="L - pad.right" [attr.y1]="t.y" [attr.y2]="t.y" class="grade" />
        <text [attr.x]="pad.left - 7" [attr.y]="t.y + 3.5" class="rotulo rotulo-y">{{ t.label }}</text>
      }
      @for (t of ticksX(); track t.x) {
        <text [attr.x]="t.x" [attr.y]="A - 8" class="rotulo" [attr.text-anchor]="t.ancora">{{ t.label }}</text>
      }

      @if (linhaAlvo(); as m) {
        <line [attr.x1]="pad.left" [attr.x2]="L - pad.right" [attr.y1]="m.y" [attr.y2]="m.y" class="alvo" />
        <text [attr.x]="L - pad.right" [attr.y]="m.y - 5" class="rotulo rotulo-alvo">meta {{ m.label }}</text>
      }

      <polygon [attr.points]="area()" fill="url(#pesoFill)" />
      <polyline [attr.points]="linha()" class="bruta" />
      @for (seg of segmentosMedia(); track $index) {
        <polyline [attr.points]="seg" class="media" />
      }
      @for (p of pontos(); track p.data) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2.4" class="ponto" />
      }

      @if (cursor(); as c) {
        <line [attr.x1]="c.x" [attr.x2]="c.x" [attr.y1]="pad.top" [attr.y2]="A - pad.bottom" class="cursor" />
        <circle [attr.cx]="c.x" [attr.cy]="c.y" r="5" class="ponto-cursor" />
      } @else if (ultimo(); as u) {
        <circle [attr.cx]="u.x" [attr.cy]="u.y" r="4.5" class="ponto-ultimo" />
        <text [attr.x]="u.x" [attr.y]="u.y - 10" class="rotulo rotulo-ultimo" [attr.text-anchor]="ancoraUltimo()">
          {{ fmt(u.peso) }}
        </text>
      }
    </svg>

    <div class="leitura">
      @if (cursor(); as c) {
        <span class="leitura-data">{{ diaSemana(c.data) }} {{ labelCurta(c.data) }}</span>
        <span class="leitura-peso">{{ fmt(c.peso) }} <small>kg</small></span>
        @if (c.media !== null) {
          <span class="muted">média 7d {{ fmt(c.media) }}</span>
        }
        <button class="fechar" (click)="cursor.set(null)" title="Fechar leitura">✕</button>
      } @else {
        <span class="muted dica">Toque ou arraste no gráfico para ler uma pesagem</span>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .grafico { width: 100%; height: auto; display: block; touch-action: pan-y; user-select: none; }
      .grade { stroke: var(--line-strong); stroke-width: 1; vector-effect: non-scaling-stroke; }
      .rotulo { font-family: var(--font-body); font-size: 10px; fill: var(--muted); }
      .rotulo-y { text-anchor: end; }
      .rotulo-alvo { text-anchor: end; fill: var(--ok); font-weight: 700; }
      .rotulo-ultimo { fill: var(--text); font-weight: 700; font-size: 11px; }
      .alvo { stroke: var(--ok); stroke-width: 1.5; stroke-dasharray: 5 4; opacity: 0.8; vector-effect: non-scaling-stroke; }
      .bruta { fill: none; stroke: var(--accent); stroke-width: 1.5; opacity: 0.55; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .media { fill: none; stroke: var(--accent-2); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
      .ponto { fill: var(--accent); }
      .ponto-ultimo { fill: var(--accent-2); stroke: var(--bg); stroke-width: 2; }
      .cursor { stroke: var(--text); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.5; vector-effect: non-scaling-stroke; }
      .ponto-cursor { fill: var(--text); stroke: var(--accent); stroke-width: 2; }

      .leitura { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; min-height: 1.5rem; margin-top: 0.1rem; font-size: 0.78rem; }
      .leitura-data { font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.72rem; }
      .leitura-peso { font-family: var(--font-display); font-size: 1.05rem; }
      .leitura-peso small { font-size: 0.65rem; color: var(--muted); font-family: var(--font-body); }
      .fechar { margin-left: auto; color: var(--muted); font-size: 0.8rem; padding: 0 0.3rem; }
      .dica { font-size: 0.72rem; }
    `,
  ],
})
export class PesoChartComponent {
  /** Pesagens em ordem cronológica. */
  readonly pesos = input.required<RegistroPeso[]>();
  /** Janela em dias até hoje; null mostra tudo. */
  readonly dias = input<number | null>(null);
  readonly alvo = input<number | null>(null);

  protected readonly L = LARGURA;
  protected readonly A = ALTURA;
  protected readonly pad = PAD;
  protected readonly viewBox = `0 0 ${LARGURA} ${ALTURA}`;
  protected readonly cursor = signal<Ponto | null>(null);
  protected readonly diaSemana = diaSemana;
  protected readonly labelCurta = labelCurta;

  private readonly hojeDias = diasDesdeEpoca(hojeLocal());

  /** Média móvel calculada na série inteira, para a janela visível não cortar o passado. */
  private readonly medias = computed<(number | null)[]>(() => {
    const ps = this.pesos();
    return ps.map((p, i) => {
      const fim = diasDesdeEpoca(p.data);
      const janela = ps.slice(0, i + 1).filter((q) => fim - diasDesdeEpoca(q.data) < JANELA_MEDIA);
      if (janela.length < 2) return null;
      return Math.round((janela.reduce((acc, q) => acc + q.peso, 0) / janela.length) * 100) / 100;
    });
  });

  private readonly dominioX = computed(() => {
    const ps = this.pesos();
    const d = this.dias();
    const primeiro = ps.length ? diasDesdeEpoca(ps[0].data) : this.hojeDias;
    const x0 = d === null ? primeiro : Math.max(primeiro, this.hojeDias - d);
    return { x0, x1: Math.max(this.hojeDias, x0 + 1) };
  });

  private readonly visiveis = computed(() => {
    const { x0 } = this.dominioX();
    const ms = this.medias();
    return this.pesos()
      .map((p, i) => ({ ...p, dia: diasDesdeEpoca(p.data), media: ms[i] }))
      .filter((p) => p.dia >= x0);
  });

  private readonly dominioY = computed(() => {
    const valores = this.visiveis().flatMap((p) => (p.media !== null ? [p.peso, p.media] : [p.peso]));
    const alvo = this.alvo();
    if (alvo) valores.push(alvo);
    if (valores.length === 0) return { min: 0, max: 1, passo: 1 };
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    const folga = Math.max(0.3, (max - min) * 0.12);
    min -= folga;
    max += folga;
    if (max - min < 1.5) {
      const centro = (min + max) / 2;
      min = centro - 0.75;
      max = centro + 0.75;
    }
    const passo = this.passoBonito(max - min);
    return { min: Math.floor(min / passo) * passo, max: Math.ceil(max / passo) * passo, passo };
  });

  private passoBonito(span: number): number {
    for (const p of [0.5, 1, 2, 5, 10, 20]) if (span / p <= 6) return p;
    return 50;
  }

  private px(dia: number): number {
    const { x0, x1 } = this.dominioX();
    return PAD.left + ((dia - x0) / (x1 - x0)) * (LARGURA - PAD.left - PAD.right);
  }

  private py(valor: number): number {
    const { min, max } = this.dominioY();
    return PAD.top + (1 - (valor - min) / (max - min)) * (ALTURA - PAD.top - PAD.bottom);
  }

  protected readonly pontos = computed<Ponto[]>(() =>
    this.visiveis().map((p) => ({
      x: this.px(p.dia),
      y: this.py(p.peso),
      dia: p.dia,
      data: p.data,
      peso: p.peso,
      media: p.media,
    })),
  );

  protected readonly ultimo = computed(() => this.pontos().at(-1) ?? null);

  protected readonly ancoraUltimo = computed<'start' | 'middle' | 'end'>(() => {
    const u = this.ultimo();
    if (!u) return 'middle';
    if (u.x > LARGURA - PAD.right - 24) return 'end';
    if (u.x < PAD.left + 24) return 'start';
    return 'middle';
  });

  protected readonly ticksY = computed<TickY[]>(() => {
    const { min, max, passo } = this.dominioY();
    const casas = passo < 1 ? 1 : 0;
    const ticks: TickY[] = [];
    for (let v = min; v <= max + 1e-9; v += passo) {
      const valor = Math.round(v * 100) / 100;
      ticks.push({ valor, y: this.py(valor), label: this.fmt(valor, casas) });
    }
    return ticks;
  });

  protected readonly ticksX = computed<TickX[]>(() => {
    const { x0, x1 } = this.dominioX();
    const span = x1 - x0;
    const n = 4;
    const longo = span > 365;
    return Array.from({ length: n + 1 }, (_, i) => {
      const dia = Math.round(x0 + (span * i) / n);
      const data = dataDeDias(dia);
      const [a, m] = data.split('-');
      return {
        x: this.px(dia),
        label: longo ? `${m}/${a.slice(2)}` : labelCurta(data),
        ancora: i === 0 ? 'start' : i === n ? 'end' : 'middle',
      };
    });
  });

  protected readonly linhaAlvo = computed(() => {
    const alvo = this.alvo();
    if (!alvo) return null;
    return { y: this.py(alvo), label: this.fmt(alvo) };
  });

  protected readonly linha = computed(() => this.pontos().map((p) => `${p.x},${p.y}`).join(' '));

  protected readonly area = computed(() => {
    const ps = this.pontos();
    if (ps.length < 2) return '';
    const base = ALTURA - PAD.bottom;
    return `${ps[0].x},${base} ${this.linha()} ${ps[ps.length - 1].x},${base}`;
  });

  /** Média em trechos contíguos, para não ligar pontos separados por lacunas. */
  protected readonly segmentosMedia = computed<string[]>(() => {
    const segs: string[] = [];
    let atual: string[] = [];
    for (const p of this.pontos()) {
      if (p.media === null) {
        if (atual.length >= 2) segs.push(atual.join(' '));
        atual = [];
        continue;
      }
      atual.push(`${p.x},${this.py(p.media)}`);
    }
    if (atual.length >= 2) segs.push(atual.join(' '));
    return segs;
  });

  protected fmt(n: number, casas = 1): string {
    return n.toFixed(casas).replace('.', ',');
  }

  /** Seleciona a pesagem mais próxima do dedo/mouse. No desktop, passar o mouse já lê. */
  protected apontar(ev: PointerEvent): void {
    const svg = ev.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const ps = this.pontos();
    if (!r.width || ps.length === 0) return;
    const x = ((ev.clientX - r.left) / r.width) * LARGURA;
    let melhor = ps[0];
    for (const p of ps) if (Math.abs(p.x - x) < Math.abs(melhor.x - x)) melhor = p;
    this.cursor.set(melhor);
  }

  /** No toque a leitura fica até ser fechada; com mouse some ao sair do gráfico. */
  protected sair(ev: PointerEvent): void {
    if (ev.pointerType === 'mouse') this.cursor.set(null);
  }
}
