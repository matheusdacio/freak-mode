import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tabs',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="conteudo">
      <router-outlet />
    </div>

    <nav class="tabbar">
      <div class="tabbar-inner">
        <a
          class="tab"
          routerLink="/"
          routerLinkActive="ativo"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <span class="ico">🏋️</span>
          <span class="lbl">Treino</span>
        </a>
        <a class="tab" routerLink="/dieta" routerLinkActive="ativo">
          <span class="ico">🥗</span>
          <span class="lbl">Dieta</span>
        </a>
        <a class="tab" routerLink="/corpo" routerLinkActive="ativo">
          <span class="ico">📊</span>
          <span class="lbl">Corpo</span>
        </a>
        <a class="tab" routerLink="/config" routerLinkActive="ativo">
          <span class="ico">⚙️</span>
          <span class="lbl">Config</span>
        </a>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .conteudo {
        padding-bottom: calc(80px + env(safe-area-inset-bottom));
      }
      .tabbar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        background: rgba(10, 9, 16, 0.85);
        backdrop-filter: blur(16px);
        border-top: 1px solid var(--line);
        padding-bottom: env(safe-area-inset-bottom);
      }
      .tabbar-inner {
        max-width: 560px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        padding: 0.4rem 0.5rem 0.3rem;
        gap: 0.3rem;
      }
      .tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0;
        border-radius: var(--radius-sm);
        color: var(--muted);
        text-decoration: none;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .tab .ico {
        font-size: 1.45rem;
        line-height: 1;
        filter: grayscale(0.55) opacity(0.65);
        transition: filter 0.15s ease, transform 0.15s ease;
      }
      .tab .lbl {
        font-size: 0.66rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .tab:active {
        background: var(--surface);
      }
      .tab.ativo {
        color: var(--accent-2);
        background: var(--accent-soft);
      }
      .tab.ativo .ico {
        filter: none;
        transform: translateY(-1px);
      }
    `,
  ],
})
export class TabsComponent {}
