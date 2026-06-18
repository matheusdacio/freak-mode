import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

const ERROS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'Senha muito curta (mínimo 6 caracteres).',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tela">
      <div class="hero anim-in">
        <div class="halo"></div>
        <img class="logo" src="assets/icons/icon-512.png" alt="FreakMode" />
      </div>

      <h1 class="anim-in">FREAK<span>MODE</span></h1>
      <p class="tagline anim-in">TREINE · REGISTRE · EVOLUA</p>

      <form class="form anim-in" [formGroup]="form" (ngSubmit)="submeter()">
        <input
          class="field"
          type="email"
          placeholder="E-mail"
          formControlName="email"
          autocomplete="email"
        />
        <input
          class="field"
          type="password"
          placeholder="Senha"
          formControlName="senha"
          autocomplete="current-password"
        />

        @if (erro()) {
          <p class="erro">{{ erro() }}</p>
        }

        <button
          class="btn btn-primary btn-block"
          type="submit"
          [disabled]="form.invalid || carregando()"
        >
          {{ carregando() ? 'Aguarde…' : (registro() ? 'Criar conta' : 'Entrar') }}
        </button>
      </form>

      <button class="link" (click)="registro.set(!registro())">
        {{ registro() ? 'Já tenho conta — Entrar' : 'Primeira vez? Criar conta' }}
      </button>
    </div>
  `,
  styles: [
    `
      .tela {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem;
      }
      .hero {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
      }
      .halo {
        position: absolute;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
        pointer-events: none;
      }
      .logo {
        position: relative;
        width: 124px;
        height: 124px;
        filter: drop-shadow(0 8px 28px rgba(124, 58, 237, 0.45));
      }
      h1 {
        font-family: var(--font-display);
        font-size: 3.4rem;
        line-height: 0.9;
        letter-spacing: 0.03em;
        text-align: center;
      }
      h1 span {
        background: linear-gradient(135deg, var(--accent-2) 0%, var(--accent-dim) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .tagline {
        font-size: 0.7rem;
        letter-spacing: 0.4em;
        color: var(--muted);
        font-weight: 700;
        margin-bottom: 1.25rem;
      }
      .form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        background: rgba(20, 17, 28, 0.6);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 1.25rem;
        backdrop-filter: blur(12px);
      }
      .erro {
        color: var(--danger);
        font-size: 0.875rem;
        text-align: center;
      }
      .link {
        font-size: 0.875rem;
        color: var(--muted);
        text-decoration: underline;
        text-underline-offset: 3px;
        background: none;
        border: none;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      .link:active {
        color: var(--accent-2);
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly registro = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async submeter(): Promise<void> {
    if (this.form.invalid) return;
    this.carregando.set(true);
    this.erro.set('');
    const { email, senha } = this.form.getRawValue();
    try {
      if (this.registro()) {
        await this.auth.registrar(email, senha);
      } else {
        await this.auth.entrar(email, senha);
      }
      await this.router.navigate(['']);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      this.erro.set(ERROS[code] ?? `[${code}] ${(e as Error).message}`);
      this.carregando.set(false);
    }
  }
}
