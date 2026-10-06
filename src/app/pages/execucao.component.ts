import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercicio } from '@models/exercicio.model';
import { RegistroSerie, Sessao } from '@models/sessao.model';
import { Treino } from '@models/treino.model';
import { SessaoService } from '@services/sessao.service';
import { TreinoService } from '@services/treino.service';
import { hojeLocal, labelRelativa } from '../shared/datas';
import { faixaLabel, serieFeita, unidade } from '../shared/exercicio-util';

/** Sessão já concluída hoje, oferecida para continuar em vez de abrir a próxima. */
interface SessaoDeHoje {
  id: string;
  ordem: number;
  feitas: number;
  total: number;
}

@Component({
  selector: 'app-execucao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (treino(); as t) {
      <header class="topo anim-in">
        <div class="topo-nav">
          <button class="voltar" (click)="voltar()">{{ editando() ? '← Voltar' : '← Treinos' }}</button>
          <button class="btn-modo" (click)="minimalista.set(!minimalista())">
            {{ minimalista() ? '⊞ Detalhes' : '⊟ Simples' }}
          </button>
        </div>
        <p class="kicker">{{ kicker() }}</p>
        <h1>{{ t.nome }}</h1>
        @if (t.obs) {
          <p class="treino-obs">{{ t.obs }}</p>
        }

        @if (progresso().total > 0) {
          <div class="progresso">
            <div class="progresso-info">
              <span>{{ progresso().feitas }}/{{ progresso().total }} séries</span>
              <span class="progresso-pct">{{ progresso().pct }}%</span>
            </div>
            <div class="progresso-trilha">
              <div class="progresso-fill" [style.width.%]="progresso().pct"></div>
            </div>
          </div>
        }
      </header>

      @if (sessao(); as s) {
        @if (retomando()) {
          <div class="banner-rascunho anim-in">
            <span>↩ Retomando sessão anterior</span>
            <button class="btn-descartar" (click)="descartar()">Descartar</button>
          </div>
        }

        @if (s.itens.length === 0) {
          <p class="muted vazio">
            Este treino não tem exercícios. Edite-o para adicionar.
          </p>
        }

        @for (item of s.itens; track item.exercicioId; let ei = $index) {
          <section
            class="ex anim-in"
            [class.ex--min]="minimalista()"
            [style.animation-delay.ms]="ei * 60"
          >
            <div class="ex-cabecalho">
              <span class="ex-num">{{ ei + 1 }}</span>
              <h2>{{ item.nomeExercicio }}</h2>
              @if (faixaReps(item.exercicioId); as faixa) {
                <span class="ex-alvo">{{ faixa }}</span>
              }
            </div>
            @if (obsExercicio(item.exercicioId); as obs) {
              <p class="ex-obs">{{ obs }}</p>
            }
            @if (!minimalista()) {
              <div class="grade-cabecalho">
                <span>Série</span>
                <span>{{ porTempo(item.exercicioId) ? 'Nível' : 'Peso (kg)' }}</span>
                <span>{{ porTempo(item.exercicioId) ? 'Minutos' : 'Reps' }}</span>
              </div>
            }
            @for (serie of item.series; track $index; let si = $index) {
              <div class="grade">
                <span class="serie-num" [class.feita]="feita(item.exercicioId, serie)">
                  @if (feita(item.exercicioId, serie)) {✓} @else {{{ si + 1 }}}
                </span>
                <input
                  class="cell"
                  [class.com-ref]="serie.peso === null && serie.pesoAnterior != null"
                  type="number"
                  inputmode="decimal"
                  [value]="serie.peso ?? ''"
                  (input)="setPeso(ei, si, $event)"
                  [placeholder]="serie.pesoAnterior != null ? serie.pesoAnterior : '—'"
                />
                <input
                  class="cell"
                  type="number"
                  inputmode="numeric"
                  [value]="serie.reps ?? ''"
                  (input)="setReps(ei, si, $event)"
                  placeholder="—"
                />
              </div>
            }
            @if (!minimalista()) {
              <input
                class="field notas"
                type="text"
                [value]="item.notas"
                (input)="setNotas(ei, $event)"
                placeholder="Notas (opcional)…"
              />
            }
          </section>
        }

        <div class="rodape">
          @if (autoSalvo()) {
            <p class="indicador-salvo">✓ Progresso salvo</p>
          }
          @if (editando()) {
            <button class="btn btn-primary btn-block" (click)="salvarEdicao()">
              Salvar alterações
            </button>
            <button class="btn-excluir" (click)="excluirSessao()">Excluir esta sessão</button>
          } @else {
            <button class="btn btn-primary btn-block" (click)="concluir()">
              Concluir treino →
            </button>
          }
        </div>
      } @else if (sessaoDeHoje(); as h) {
        <section class="hoje anim-in">
          <p class="hoje-titulo">Você já concluiu este treino hoje</p>
          <p class="hoje-desc">
            Sessão nº {{ h.ordem }}, com {{ h.feitas }} de {{ h.total }} séries preenchidas.
            Dá para continuar nela em vez de abrir outra.
          </p>
          <button class="btn btn-primary btn-block" (click)="continuarHoje(h.id)">
            Continuar a sessão de hoje
          </button>
          <button class="btn btn-ghost btn-block" (click)="comecarNova()">
            Começar uma nova sessão
          </button>
        </section>
      }
    } @else {
      <p class="muted carregando">Carregando…</p>
    }
  `,
  styles: [
    `
      .topo {
        padding: 1.5rem 0 1rem;
      }
      .topo-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.9rem;
      }
      .voltar {
        color: var(--muted);
        font-size: 0.9rem;
        padding: 0.2rem 0;
      }
      .voltar:active {
        color: var(--accent-2);
      }
      .btn-modo {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--muted);
        padding: 0.35rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--surface);
        text-transform: uppercase;
      }
      .btn-modo:active {
        color: var(--accent-2);
        border-color: var(--accent-dim);
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.3em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.6rem;
        line-height: 0.95;
        margin-top: 0.25rem;
        text-transform: uppercase;
      }

      /* ---- Progresso ---- */
      .progresso {
        margin-top: 0.9rem;
      }
      .progresso-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 0.35rem;
      }
      .progresso-pct {
        color: var(--accent-2);
      }
      .progresso-trilha {
        height: 5px;
        border-radius: 999px;
        background: var(--surface-2);
        overflow: hidden;
      }
      .progresso-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent-dim) 0%, var(--accent) 100%);
        box-shadow: 0 0 10px var(--accent-glow);
        transition: width 0.3s ease;
      }

      .banner-rascunho {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        border-radius: var(--radius-sm);
        padding: 0.65rem 0.9rem;
        font-size: 0.85rem;
        margin-bottom: 1rem;
        color: var(--muted);
      }
      .btn-descartar {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--danger);
        letter-spacing: 0.04em;
      }
      .vazio {
        padding: 2rem 0;
      }
      .carregando {
        text-align: center;
        padding: 2rem;
      }

      /* ---- Já concluiu hoje ---- */
      .hoje {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--accent-dim);
        border-radius: var(--radius);
        padding: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .hoje-titulo {
        font-family: var(--font-display);
        font-size: 1.3rem;
        text-transform: uppercase;
      }
      .hoje-desc {
        font-size: 0.85rem;
        color: var(--muted);
        line-height: 1.45;
        margin-bottom: 0.3rem;
      }

      .ex {
        background: linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 140%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 0.9rem;
      }
      .ex--min {
        padding: 0.85rem;
      }
      .ex-cabecalho {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.75rem;
      }
      .ex--min .ex-cabecalho {
        margin-bottom: 0.5rem;
      }
      .treino-obs {
        margin-top: 0.6rem;
        font-size: 0.78rem;
        line-height: 1.45;
        color: var(--muted);
      }
      .ex-obs {
        margin: -0.35rem 0 0.75rem;
        font-size: 0.78rem;
        line-height: 1.4;
        color: var(--accent-2);
      }
      .ex-alvo {
        margin-left: auto;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--accent-2);
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        border-radius: 999px;
        padding: 0.2rem 0.55rem;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .ex-num {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 999px;
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        color: var(--accent-2);
        font-size: 0.75rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      h2 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .grade-cabecalho,
      .grade {
        display: grid;
        grid-template-columns: 2.5rem 1fr 1fr;
        gap: 0.5rem;
        align-items: center;
      }
      .grade-cabecalho {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--muted);
        margin-bottom: 0.4rem;
      }
      .grade {
        margin-bottom: 0.45rem;
      }
      .serie-num {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--surface-2);
        border: 1px solid var(--line);
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--muted);
        transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }
      .serie-num.feita {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        border-color: transparent;
        color: #fff;
        box-shadow: 0 0 12px -2px var(--accent-glow);
      }
      .cell {
        background: var(--bg);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 0.7rem;
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
        outline: none;
        width: 100%;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .cell:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }
      /* Peso anterior exibido apagado, só como referência */
      .cell.com-ref::placeholder {
        color: var(--accent-2);
        opacity: 0.32;
        font-weight: 700;
      }
      .cell::placeholder {
        color: var(--muted);
        opacity: 0.5;
        font-weight: 400;
      }
      .notas {
        margin-top: 0.6rem;
        font-size: 0.9rem;
        background: var(--bg);
      }
      .rodape {
        position: sticky;
        bottom: 0;
        padding: 1rem 0 0.5rem;
        margin-top: 1rem;
        background: linear-gradient(transparent, var(--bg) 35%);
      }
      .indicador-salvo {
        font-size: 0.8rem;
        color: var(--accent-2);
        text-align: center;
        margin-bottom: 0.6rem;
        animation: aparecer 0.2s ease;
      }
      .btn-excluir {
        display: block;
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.55rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--danger);
        opacity: 0.75;
      }
      .btn-excluir:active {
        opacity: 1;
      }
      @keyframes aparecer {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `,
  ],
})
export class ExecucaoComponent implements OnInit, OnDestroy {
  private readonly treinoSvc = inject(TreinoService);
  private readonly sessaoSvc = inject(SessaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly treino = signal<Treino | undefined>(undefined);
  protected readonly sessao = signal<Sessao | undefined>(undefined);
  protected readonly minimalista = signal(false);
  protected readonly retomando = signal(false);
  protected readonly autoSalvo = signal(false);
  /** Corrigindo uma sessão já concluída (aberta pelo histórico, calendário ou "continuar a de hoje"). */
  protected readonly editando = signal(false);
  protected readonly sessaoDeHoje = signal<SessaoDeHoje | null>(null);

  private readonly exPorId = computed(
    () => new Map((this.treino()?.exercicios ?? []).map((e): [string, Exercicio] => [e.id, e])),
  );

  protected readonly kicker = computed(() => {
    const s = this.sessao();
    const ordem = s?.ordem ?? 1;
    if (!this.editando()) return `EXECUTANDO · SESSÃO Nº ${ordem}`;
    const quando = s?.data ? ` · ${labelRelativa(s.data).toUpperCase()}` : '';
    return `EDITANDO · SESSÃO Nº ${ordem}${quando}`;
  });

  protected readonly progresso = computed(() => {
    const s = this.sessao();
    return s ? this.contar(s) : { feitas: 0, total: 0, pct: 0 };
  });

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const sessaoId = this.route.snapshot.paramMap.get('sessaoId');
    if (!id) return;
    const t = await this.treinoSvc.obter(id);
    this.treino.set(t);
    if (!t) return;

    if (sessaoId) {
      const s = await this.sessaoSvc.obter(sessaoId);
      if (!s || s.treinoId !== t.id) {
        this.router.navigate(['/treino', t.id, 'historico'], { replaceUrl: true });
        return;
      }
      this.editando.set(s.status !== 'rascunho');
      this.sessao.set(s);
      return;
    }

    const rascunho = await this.sessaoSvc.buscarRascunho(t.id);
    if (rascunho) {
      this.sessao.set(rascunho);
      this.retomando.set(true);
      return;
    }

    // Concluiu hoje e voltou: oferece continuar na mesma em vez de abrir a sessão seguinte.
    const ultima = await this.sessaoSvc.ultima(t.id);
    if (ultima && ultima.data === hojeLocal()) {
      const { feitas, total } = this.contar(ultima);
      this.sessaoDeHoje.set({ id: ultima.id, ordem: ultima.ordem, feitas, total });
      return;
    }

    this.sessao.set(await this.sessaoSvc.novaSessao(t));
  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }

  private contar(s: Sessao): { feitas: number; total: number; pct: number } {
    let feitas = 0;
    let total = 0;
    for (const item of s.itens) {
      const ex = this.exPorId().get(item.exercicioId);
      for (const serie of item.series) {
        total++;
        if (serieFeita(serie, ex)) feitas++;
      }
    }
    return { feitas, total, pct: total ? Math.round((feitas / total) * 100) : 0 };
  }

  protected feita(exercicioId: string, serie: RegistroSerie): boolean {
    return serieFeita(serie, this.exPorId().get(exercicioId));
  }

  protected porTempo(exercicioId: string): boolean {
    return unidade(this.exPorId().get(exercicioId)) === 'min';
  }

  protected faixaReps(exercicioId: string): string {
    const ex = this.exPorId().get(exercicioId);
    return ex ? faixaLabel(ex) : '';
  }

  protected obsExercicio(exercicioId: string): string {
    return this.exPorId().get(exercicioId)?.obs ?? '';
  }

  protected continuarHoje(sessaoId: string): void {
    const t = this.treino();
    if (t) this.router.navigate(['/treino', t.id, 'sessao', sessaoId], { replaceUrl: true });
  }

  protected async comecarNova(): Promise<void> {
    const t = this.treino();
    if (!t) return;
    this.sessaoDeHoje.set(null);
    this.sessao.set(await this.sessaoSvc.novaSessao(t));
  }

  protected async descartar(): Promise<void> {
    const s = this.sessao();
    if (s) await this.sessaoSvc.remover(s.id);
    const t = this.treino();
    if (t) this.sessao.set(await this.sessaoSvc.novaSessao(t));
    this.retomando.set(false);
  }

  private patch(fn: (s: Sessao) => void): void {
    const atual = this.sessao();
    if (!atual) return;
    const copia: Sessao = {
      ...atual,
      itens: atual.itens.map((i) => ({ ...i, series: i.series.map((x) => ({ ...x })) })),
    };
    fn(copia);
    this.sessao.set(copia);
    this.scheduleSave(copia);
  }

  private scheduleSave(sessao: Sessao): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.sessaoSvc.salvar(sessao).then(() => {
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.autoSalvo.set(true);
        this.hideTimer = setTimeout(() => this.autoSalvo.set(false), 2000);
      });
    }, 1500);
  }

  /** Grava agora o que ainda estava na fila do autosave, para sair da tela sem perder a última digitação. */
  private async flush(): Promise<void> {
    if (!this.saveTimer) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const s = this.sessao();
    if (s) await this.sessaoSvc.salvar(s);
  }

  private numero(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    if (raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  protected setPeso(ei: number, si: number, event: Event): void {
    const v = this.numero(event);
    this.patch((s) => {
      const serie = s.itens[ei]?.series[si];
      if (serie) serie.peso = v;
    });
  }

  protected setReps(ei: number, si: number, event: Event): void {
    const v = this.numero(event);
    this.patch((s) => {
      const serie = s.itens[ei]?.series[si];
      if (serie) serie.reps = v;
    });
  }

  protected setNotas(ei: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.patch((s) => {
      const item = s.itens[ei];
      if (item) item.notas = valor;
    });
  }

  protected async concluir(): Promise<void> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const s = this.sessao();
    if (!s) return;
    const concluida: Sessao = { ...s, status: 'concluida' };
    await this.sessaoSvc.salvar(concluida);
    this.router.navigate(['/treino', s.treinoId, 'historico']);
  }

  protected async salvarEdicao(): Promise<void> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const s = this.sessao();
    if (!s) return;
    await this.sessaoSvc.salvar(s);
    this.location.back();
  }

  protected async excluirSessao(): Promise<void> {
    const s = this.sessao();
    if (!s) return;
    const quando = s.data ? ` de ${labelRelativa(s.data)}` : '';
    if (!confirm(`Excluir a sessão nº ${s.ordem}${quando}? Isso não pode ser desfeito.`)) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.sessaoSvc.remover(s.id);
    this.location.back();
  }

  protected async voltar(): Promise<void> {
    await this.flush();
    if (this.editando()) this.location.back();
    else this.router.navigate(['/']);
  }
}
