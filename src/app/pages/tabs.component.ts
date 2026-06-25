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
      </div>
    </nav>
  `,
  styles: [
    `
      .conteudo {
        padding-bottom: calc(74px + env(safe-area-inset-bottom));
      }
      .tabbar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        background: rgba(12, 10, 20, 0.82);
        backdrop-filter: blur(14px);
        border-top: 1px solid var(--line);
        padding-bottom: env(safe-area-inset-bottom);
      }
      .tabbar-inner {
        max-width: 560px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
      .tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        padding: 0.6rem 0 0.5rem;
        color: var(--muted);
        text-decoration: none;
        transition: color 0.15s ease;
        position: relative;
      }
      .tab .ico {
        font-size: 1.3rem;
        line-height: 1;
        filter: grayscale(0.6) opacity(0.7);
        transition: filter 0.15s ease, transform 0.15s ease;
      }
      .tab .lbl {
        font-size: 0.66rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .tab.ativo {
        color: var(--accent-2);
      }
      .tab.ativo .ico {
        filter: none;
        transform: translateY(-1px);
      }
      .tab.ativo::before {
        content: '';
        position: absolute;
        top: 0;
        width: 28px;
        height: 3px;
        border-radius: 0 0 4px 4px;
        background: linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%);
        box-shadow: 0 0 10px var(--accent-glow);
      }
    `,
  ],
})
export class TabsComponent {}
