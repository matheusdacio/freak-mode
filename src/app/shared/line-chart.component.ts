import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Ponto {
  cx: number;
  cy: number;
  valor: number;
}

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pontos().length >= 2) {
      <svg [attr.viewBox]="viewBox" preserveAspectRatio="none" class="grafico">
        <defs>
          <linearGradient id="freakFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon [attr.points]="area()" fill="url(#freakFill)" />
        <polyline
          [attr.points]="linha()"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        @for (p of pontos(); track $index; let ultimo = $last) {
          <circle
            [attr.cx]="p.cx"
            [attr.cy]="p.cy"
            [attr.r]="ultimo ? 4 : 2.5"
            [attr.fill]="ultimo ? 'var(--accent-2)' : 'var(--accent)'"
          />
        }
      </svg>
      <div class="rotulos muted">
        <span>{{ minimo() }}</span>
        <span>{{ maximo() }}</span>
      </div>
    } @else {
      <p class="muted insuficiente">
        Registre pelo menos 2 sessões para ver a progressão.
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .grafico {
        width: 100%;
        height: 96px;
        display: block;
      }
      .rotulos {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        margin-top: 0.3rem;
      }
      .insuficiente {
        font-size: 0.85rem;
        padding: 0.5rem 0;
      }
    `,
  ],
})
export class LineChartComponent {
  readonly valores = input.required<number[]>();

  private readonly largura = 100;
  private readonly altura = 40;
  protected readonly viewBox = `0 0 ${this.largura} ${this.altura}`;

  protected readonly maximo = computed(() => Math.max(...this.valores()));
  protected readonly minimo = computed(() => Math.min(...this.valores()));

  protected readonly pontos = computed<Ponto[]>(() => {
    const vals = this.valores();
    if (vals.length < 2) {
      return [];
    }
    const max = this.maximo();
    const min = this.minimo();
    const span = max - min || 1;
    const passo = this.largura / (vals.length - 1);
    return vals.map((valor, i) => ({
      cx: i * passo,
      cy: this.altura - ((valor - min) / span) * (this.altura - 4) - 2,
      valor,
    }));
  });

  protected readonly linha = computed(() =>
    this.pontos()
      .map((p) => `${p.cx},${p.cy}`)
      .join(' '),
  );

  protected readonly area = computed(
    () => `0,${this.altura} ${this.linha()} ${this.largura},${this.altura}`,
  );
}
