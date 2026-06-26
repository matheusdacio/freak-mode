import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NOMES_MEDIDAS, SaudeService } from '@services/saude.service';
import { DiaAgua, RegistroMedidas, RegistroPeso } from '@models/saude.model';
import { LineChartComponent } from '../shared/line-chart.component';

@Component({
  selector: 'app-corpo',
  imports: [FormsModule, LineChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <p class="kicker">EVOLUÇÃO</p>
      <h1>CORPO</h1>
    </header>

    <!-- ===== ÁGUA ===== -->
    <section class="card anim-in">
      <div class="card-head">
        <h2>💧 Água</h2>
        <button class="mini" (click)="definirMeta()">meta: {{ metaAgua() }}ml</button>
      </div>
      <div class="agua-top">
        <span class="agua-val"><strong>{{ agua().ml }}</strong> / {{ metaAgua() }} ml</span>
        <span class="agua-pct">{{ aguaPct() }}%</span>
      </div>
      <div class="trilha">
        <div class="fill fill--agua" [style.width.%]="aguaPct()"></div>
      </div>
      <div class="agua-botoes">
        <button class="chip" (click)="addAgua(250)">+ copo (250)</button>
        <button class="chip" (click)="addAgua(500)">+ garrafa (500)</button>
        <button class="chip chip--menos" (click)="addAgua(-250)">−250</button>
      </div>
    </section>

    <!-- ===== PESO ===== -->
    <section class="card anim-in">
      <div class="card-head">
        <h2>⚖️ Peso</h2>
        @if (pesos().length > 0) {
          <span class="atual">
            {{ pesoAtual() }}<small>kg</small>
            @if (pesoDelta() !== null) {
              <span class="delta" [class.up]="pesoDelta()! > 0" [class.down]="pesoDelta()! < 0">
                {{ pesoDelta()! > 0 ? '▲' : pesoDelta()! < 0 ? '▼' : '' }}{{ absDelta() }}
              </span>
            }
          </span>
        }
      </div>

      @if (pesoSerie().length >= 2) {
        <app-line-chart [valores]="pesoSerie()" />
      } @else if (pesos().length === 0) {
        <p class="vazio-msg muted">Registre seu peso pra começar a acompanhar a evolução.</p>
      }

      <div class="registrar">
        <input
          class="field"
          type="number"
          inputmode="decimal"
          placeholder="Peso de hoje (kg)"
          [(ngModel)]="pesoInput"
        />
        <button class="btn btn-primary" [disabled]="!pesoInput" (click)="registrarPeso()">Salvar</button>
      </div>
    </section>

    <!-- ===== MEDIDAS ===== -->
    <section class="card anim-in">
      <div class="card-head">
        <h2>📏 Medidas <small class="muted">(cm)</small></h2>
        <button class="mini" (click)="abrirMedidas()">{{ editandoMedidas() ? 'cancelar' : '+ registrar' }}</button>
      </div>

      @if (editandoMedidas()) {
        <div class="med-form">
          @for (nome of nomes; track nome) {
            <label>{{ nome }}<input class="field" type="number" inputmode="decimal" [(ngModel)]="medForm[nome]" /></label>
          }
        </div>
        <button class="btn btn-primary btn-block" (click)="salvarMedidas()">Salvar medidas de hoje</button>
      } @else if (ultimaMedida(); as um) {
        <div class="med-grid">
          @for (nome of nomes; track nome) {
            @if (um.valores[nome] != null) {
              <div class="med">
                <span class="med-nome">{{ nome }}</span>
                <span class="med-val">
                  {{ um.valores[nome] }}<small>cm</small>
                  @if (deltaMedida(nome); as d) {
                    <span class="delta" [class.up]="d > 0" [class.down]="d < 0">
                      {{ d > 0 ? '▲' : '▼' }}{{ absNum(d) }}
                    </span>
                  }
                </span>
              </div>
            }
          }
        </div>
        <p class="med-data muted">Atualizado em {{ labelData(um.data) }}</p>
      } @else {
        <p class="vazio-msg muted">Nenhuma medida registrada. Toque em "+ registrar".</p>
      }
    </section>
  `,
  styles: [
    `
      .topo { padding: 1.5rem 0 1rem; }
      .kicker { font-size: 0.7rem; letter-spacing: 0.4em; color: var(--accent); font-weight: 700; }
      h1 { font-family: var(--font-display); font-size: 2.6rem; line-height: 0.95; text-transform: uppercase; margin-top: 0.25rem; }

      .card { background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; margin-bottom: 0.9rem; }
      .card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.7rem; }
      h2 { font-family: var(--font-display); font-size: 1.3rem; text-transform: uppercase; }
      h2 small { font-size: 0.7rem; }
      .mini { font-size: 0.74rem; font-weight: 700; color: var(--accent-2); border: 1px solid var(--accent-dim); background: var(--accent-soft); border-radius: 999px; padding: 0.3rem 0.7rem; }

      .atual { font-family: var(--font-display); font-size: 1.6rem; display: flex; align-items: baseline; gap: 0.35rem; }
      .atual small { font-size: 0.7rem; color: var(--muted); }
      .delta { font-size: 0.7rem; font-weight: 700; font-family: var(--font-sans, sans-serif); }
      .delta.up { color: var(--danger); }
      .delta.down { color: #3ddc84; }

      .agua-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.85rem; margin-bottom: 0.35rem; }
      .agua-val strong { font-family: var(--font-display); font-size: 1.2rem; }
      .agua-pct { color: #4aa8ff; font-weight: 700; }
      .trilha { height: 8px; border-radius: 999px; background: var(--bg); overflow: hidden; }
      .fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
      .fill--agua { background: linear-gradient(90deg, #2b6fd6 0%, #4aa8ff 100%); box-shadow: 0 0 10px rgba(74, 168, 255, 0.5); }
      .agua-botoes { display: flex; gap: 0.4rem; margin-top: 0.8rem; flex-wrap: wrap; }
      .chip { flex: 1; min-width: 5rem; font-size: 0.8rem; font-weight: 600; padding: 0.5rem; border-radius: 999px; border: 1px solid var(--line); background: var(--bg); color: var(--text); }
      .chip:active { border-color: #4aa8ff; color: #4aa8ff; }
      .chip--menos { flex: 0 0 auto; min-width: 0; color: var(--muted); }

      app-line-chart { display: block; margin: 0.3rem 0 0.8rem; }
      .registrar { display: flex; gap: 0.5rem; margin-top: 0.6rem; }
      .registrar .field { flex: 1; }
      .vazio-msg { font-size: 0.85rem; line-height: 1.5; padding: 0.5rem 0 0.8rem; }

      .med-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
      .med { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.55rem 0.7rem; }
      .med-nome { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; display: block; }
      .med-val { font-family: var(--font-display); font-size: 1.2rem; display: flex; align-items: baseline; gap: 0.3rem; }
      .med-val small { font-size: 0.6rem; color: var(--muted); }
      .med-data { font-size: 0.7rem; margin-top: 0.6rem; }
      .med-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.7rem; }
      .med-form label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
    `,
  ],
})
export class CorpoComponent implements OnInit {
  private readonly svc = inject(SaudeService);
  protected readonly nomes = NOMES_MEDIDAS;

  protected readonly pesos = signal<RegistroPeso[]>([]);
  protected readonly medidas = signal<RegistroMedidas[]>([]);
  protected readonly agua = signal<DiaAgua>({ id: '', data: '', ml: 0 });
  protected readonly metaAgua = signal<number>(3000);
  protected readonly editandoMedidas = signal(false);

  protected pesoInput: number | null = null;
  protected medForm: Record<string, number | null> = {};

  protected readonly pesoSerie = computed(() => this.pesos().map((p) => p.peso));
  protected readonly pesoAtual = computed(() => this.pesos().at(-1)?.peso ?? 0);
  protected readonly pesoDelta = computed<number | null>(() => {
    const ps = this.pesos();
    if (ps.length < 2) return null;
    return Math.round((ps.at(-1)!.peso - ps.at(-2)!.peso) * 10) / 10;
  });
  protected readonly ultimaMedida = computed(() => this.medidas().at(-1));
  protected readonly aguaPct = computed(() => {
    const meta = this.metaAgua();
    return meta > 0 ? Math.min(100, Math.round((this.agua().ml / meta) * 100)) : 0;
  });

  async ngOnInit(): Promise<void> {
    this.pesos.set(await this.svc.listarPesos());
    this.medidas.set(await this.svc.listarMedidas());
    this.metaAgua.set(await this.svc.obterMetaAgua());
    this.agua.set(await this.svc.obterAgua());
  }

  // ---- água ----
  protected async addAgua(ml: number): Promise<void> {
    const a = this.agua();
    const novo: DiaAgua = { ...a, id: this.svc.hoje(), data: this.svc.hoje(), ml: Math.max(0, a.ml + ml) };
    this.agua.set(novo);
    await this.svc.salvarAgua(novo);
  }
  protected async definirMeta(): Promise<void> {
    const v = prompt('Meta diária de água (ml):', String(this.metaAgua()));
    if (v === null) return;
    const ml = Math.max(0, Math.floor(Number(v)) || 0);
    if (!ml) return;
    this.metaAgua.set(ml);
    await this.svc.salvarMetaAgua(ml);
  }

  // ---- peso ----
  protected absDelta(): number {
    return Math.abs(this.pesoDelta() ?? 0);
  }
  protected async registrarPeso(): Promise<void> {
    const p = Number(this.pesoInput);
    if (!p || p <= 0) return;
    await this.svc.salvarPeso(Math.round(p * 10) / 10);
    this.pesos.set(await this.svc.listarPesos());
    this.pesoInput = null;
  }

  // ---- medidas ----
  protected abrirMedidas(): void {
    if (this.editandoMedidas()) {
      this.editandoMedidas.set(false);
      return;
    }
    const ultima = this.ultimaMedida();
    const form: Record<string, number | null> = {};
    for (const nome of this.nomes) form[nome] = ultima?.valores[nome] ?? null;
    this.medForm = form;
    this.editandoMedidas.set(true);
  }
  protected async salvarMedidas(): Promise<void> {
    const valores: Record<string, number> = {};
    for (const nome of this.nomes) {
      const v = Number(this.medForm[nome]);
      if (v && v > 0) valores[nome] = Math.round(v * 10) / 10;
    }
    await this.svc.salvarMedidas(valores);
    this.medidas.set(await this.svc.listarMedidas());
    this.editandoMedidas.set(false);
  }
  protected deltaMedida(nome: string): number | null {
    const m = this.medidas();
    if (m.length < 2) return null;
    const atual = m.at(-1)!.valores[nome];
    const ant = m.at(-2)!.valores[nome];
    if (atual == null || ant == null) return null;
    const d = Math.round((atual - ant) * 10) / 10;
    return d === 0 ? null : d;
  }
  protected absNum(n: number): number {
    return Math.abs(n);
  }

  protected labelData(data: string): string {
    if (data === this.svc.hoje()) return 'hoje';
    const [, m, d] = data.split('-');
    return `${d}/${m}`;
  }
}
