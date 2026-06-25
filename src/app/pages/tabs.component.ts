import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tabs',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <nav class="rail">
        <img class="rail-logo" src="assets/icons/logo.png" alt="FreakMode" />
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
      </nav>

      <div class="conteudo">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      .layout {
        display: flex;
        gap: 0.7rem;
        align-items: flex-start;
      }
      .rail {
        position: sticky;
        top: calc(env(safe-area-inset-top) + 0.5rem);
        flex-shrink: 0;
        width: 76px;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 130%);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 0.6rem 0.45rem;
      }
      .rail-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        margin: 0.1rem auto 0.5rem;
        filter: drop-shadow(0 4px 12px rgba(124, 58, 237, 0.45));
      }
      .tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 0.6rem 0;
        border-radius: var(--radius-sm);
        color: var(--muted);
        text-decoration: none;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .tab .ico {
        font-size: 1.4rem;
        line-height: 1;
        filter: grayscale(0.6) opacity(0.7);
        transition: filter 0.15s ease, transform 0.15s ease;
      }
      .tab .lbl {
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .tab:active {
        background: var(--surface-2);
      }
      .tab.ativo {
        color: var(--accent-2);
        background: var(--accent-soft);
        border: 1px solid var(--accent-dim);
        padding: calc(0.6rem - 1px) 0;
      }
      .tab.ativo .ico {
        filter: none;
        transform: translateY(-1px);
      }
      .conteudo {
        flex: 1;
        min-width: 0;
      }
    `,
  ],
})
export class TabsComponent {}
