import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-corpo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topo anim-in">
      <p class="kicker">EVOLUÇÃO</p>
      <h1>CORPO</h1>
    </header>

    <div class="vazio anim-in">
      <span class="vazio-emoji">📊</span>
      <p class="muted">
        Em breve: registro de <strong>peso corporal</strong> e
        <strong>medidas</strong> (braço, peito, cintura…) com gráficos de evolução.
      </p>
    </div>
  `,
  styles: [
    `
      .topo {
        padding: 1.5rem 0 1.25rem;
      }
      .kicker {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        font-family: var(--font-display);
        font-size: 2.6rem;
        line-height: 0.95;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }
      .vazio {
        text-align: center;
        padding: 2.5rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
      .vazio-emoji {
        font-size: 2.5rem;
      }
      .vazio p {
        line-height: 1.5;
        max-width: 320px;
      }
    `,
  ],
})
export class CorpoComponent {}
