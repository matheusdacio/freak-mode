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
        <polyline
          [attr.points]="linha()"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        @for (p of pontos(); track $index) {
          <circle [attr.cx]="p.cx" [attr.cy]="p.cy" r="3" fill="var(--accent)" />
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
        height: 90px;
        display: block;
      }
      .rotulos {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        margin-top: 0.25rem;
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
}
