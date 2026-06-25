import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessaoService } from '@services/sessao.service';
import { TreinoService } from '@services/treino.service';

interface Celula {
  dia: number | null;
  dateStr: string;
  treinos: string[];
  hoje: boolean;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-calendario',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <a class="voltar" routerLink="/">← Treinos</a>
      <p class="kicker">CONSISTÊNCIA</p>
      <h1>CALENDÁRIO</h1>
    </header>

    <div class="mes-nav anim-in">
      <button class="seta" (click)="mudarMes(-1)">‹</button>
      <span class="mes-label">{{ nomeMes() }}</span>
      <button class="seta" (click)="mudarMes(1)">›</button>
    </div>

    <p class="resumo-mes anim-in muted">
      {{ totalNoMes() }} {{ totalNoMes() === 1 ? 'treino' : 'treinos' }} neste mês
    </p>

    <section class="cal anim-in">
      <div class="semana-cab">
        @for (d of diasSemana; track $index) {
          <span class="dow">{{ d }}</span>
        }
      </div>
      <div class="grade">
        @for (c of celulas(); track $index) {
          @if (c.dia === null) {
            <span class="cel vazia"></span>
          } @else {
            <button
              class="cel"
              [class.treinou]="c.treinos.length > 0"
              [class.hoje]="c.hoje"
              [class.sel]="selecionado() === c.dateStr"
              (click)="selecionar(c.dateStr)"
            >
              <span class="num">{{ c.dia }}</span>
              @if (c.treinos.length > 0) { <span class="ponto"></span> }
            </button>
          }
        }
      </div>
    </section>

    @if (detalheSel(); as d) {
      <section class="detalhe anim-in">
        <h2>{{ d.label }}</h2>
        @if (d.treinos.length > 0) {
          @for (t of d.treinos; track $index) {
            <div class="treino-dia"><span class="tag">🏋️</span> {{ t }}</div>
          }
        } @else {
          <p class="muted">Nenhum treino registrado neste dia.</p>
        }
      </section>
    }
  `,
  styles: [
    `
      .topo { padding: 1.5rem 0 1rem; }
      .voltar { color: var(--muted); font-size: 0.9rem; display: block; margin-bottom: 0.9rem; text-decoration: none; }
      .kicker { font-size: 0.7rem; letter-spacing: 0.4em; color: var(--accent); font-weight: 700; }
      h1 { font-family: var(--font-display); font-size: 2.6rem; line-height: 0.95; text-transform: uppercase; margin-top: 0.25rem; }

      .mes-nav { display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 0.5rem 0 0.3rem; }
      .seta { width: 2.2rem; height: 2.2rem; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-size: 1.4rem; line-height: 1; color: var(--text); }
      .mes-label { font-family: var(--font-display); font-size: 1.3rem; text-transform: uppercase; min-width: 9rem; text-align: center; }
      .resumo-mes { text-align: center; font-size: 0.78rem; margin-bottom: 1rem; }

      .cal { background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.8rem; }
      .semana-cab, .grade { display: grid; grid-template-columns: repeat(7, 1fr); }
      .semana-cab { margin-bottom: 0.4rem; }
      .dow { text-align: center; font-size: 0.66rem; font-weight: 700; color: var(--muted); text-transform: uppercase; }
      .grade { gap: 4px; }
      .cel { aspect-ratio: 1; border-radius: var(--radius-sm); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-size: 0.85rem; color: var(--text); background: var(--bg); border: 1px solid transparent; position: relative; }
      .cel.vazia { background: transparent; }
      .cel .num { line-height: 1; }
      .cel.treinou { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%); color: #fff; font-weight: 700; box-shadow: 0 0 10px -3px var(--accent-glow); }
      .cel.hoje { border-color: var(--accent-2); }
      .cel.sel { outline: 2px solid var(--accent-2); outline-offset: 1px; }
      .ponto { width: 4px; height: 4px; border-radius: 999px; background: #fff; opacity: 0.9; }

      .detalhe { margin-top: 1.1rem; background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.9rem 1rem; }
      .detalhe h2 { font-family: var(--font-display); font-size: 1.2rem; text-transform: uppercase; margin-bottom: 0.5rem; }
      .treino-dia { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; font-weight: 600; }
      .tag { font-size: 1rem; }
    `,
  ],
})
export class CalendarioComponent implements OnInit {
  private readonly sessaoSvc = inject(SessaoService);
  private readonly treinoSvc = inject(TreinoService);

  private readonly porData = signal<Map<string, string[]>>(new Map());
  protected readonly diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  private readonly hoje = new Date();
  protected readonly ano = signal(this.hoje.getFullYear());
  protected readonly mes = signal(this.hoje.getMonth());
  protected readonly selecionado = signal<string | null>(null);

  protected readonly nomeMes = computed(() => `${MESES[this.mes()]} ${this.ano()}`);

  protected readonly celulas = computed<Celula[]>(() => {
    const y = this.ano();
    const m = this.mes();
    const mapa = this.porData();
    const hojeStr = this.dataStr(this.hoje.getFullYear(), this.hoje.getMonth(), this.hoje.getDate());
    const inicio = new Date(y, m, 1).getDay();
    const dias = new Date(y, m + 1, 0).getDate();
    const cels: Celula[] = [];
    for (let i = 0; i < inicio; i++) {
      cels.push({ dia: null, dateStr: '', treinos: [], hoje: false });
    }
    for (let d = 1; d <= dias; d++) {
      const ds = this.dataStr(y, m, d);
      cels.push({ dia: d, dateStr: ds, treinos: mapa.get(ds) ?? [], hoje: ds === hojeStr });
    }
    return cels;
  });

  protected readonly totalNoMes = computed(() => {
    const prefixo = `${this.ano()}-${String(this.mes() + 1).padStart(2, '0')}`;
    let total = 0;
    for (const [data, treinos] of this.porData()) {
      if (data.startsWith(prefixo)) total += treinos.length;
    }
    return total;
  });

  protected readonly detalheSel = computed(() => {
    const sel = this.selecionado();
    if (!sel) return null;
    const [y, m, d] = sel.split('-');
    return { label: `${d}/${m}/${y}`, treinos: this.porData().get(sel) ?? [] };
  });

  async ngOnInit(): Promise<void> {
    if (!this.treinoSvc.carregado()) await this.treinoSvc.carregar();
    const nomePorId = new Map(this.treinoSvc.treinos().map((t) => [t.id, t.nome]));
    const sessoes = await this.sessaoSvc.concluidas();
    const mapa = new Map<string, string[]>();
    for (const s of sessoes) {
      if (!s.data) continue;
      const nome = nomePorId.get(s.treinoId) ?? 'Treino';
      const lista = mapa.get(s.data) ?? [];
      lista.push(nome);
      mapa.set(s.data, lista);
    }
    this.porData.set(mapa);
  }

  protected mudarMes(delta: number): void {
    let m = this.mes() + delta;
    let y = this.ano();
    if (m < 0) { m = 11; y--; }
    else if (m > 11) { m = 0; y++; }
    this.mes.set(m);
    this.ano.set(y);
    this.selecionado.set(null);
  }

  protected selecionar(dateStr: string): void {
    this.selecionado.set(this.selecionado() === dateStr ? null : dateStr);
  }

  private dataStr(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}
