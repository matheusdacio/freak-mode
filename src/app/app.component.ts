import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="shell">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .shell {
        max-width: 560px;
        margin: 0 auto;
        min-height: 100dvh;
        padding: env(safe-area-inset-top) 1rem
          calc(env(safe-area-inset-bottom) + 1.5rem);
      }
    `,
  ],
})
export class AppComponent {}
