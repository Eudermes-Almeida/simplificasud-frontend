import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PaiComponent } from './componentes/pai/pai.component';
import { LoginSenhaComponent } from './componentes/login-senha/login-senha.component';
import { PrimeiroAcessoComponent } from './componentes/primeiro-acesso/primeiro-acesso.component';
import { AdminPerfisComponent } from './componentes/admin-perfis/admin-perfis.component';
import { AuthService } from './services/auth.service';

type Tela = 'login' | 'primeiro-acesso' | 'dashboard' | 'admin-perfis';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PaiComponent, LoginSenhaComponent, PrimeiroAcessoComponent, AdminPerfisComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'raio_x_unidades';

  // No servidor (SSR/prerender) localStorage não existe, então estaAutenticado() sempre
  // volta false ali -- o cliente reavalia certo antes da primeira pintura, mas por isso
  // as telas abaixo usam ngSkipHydration (mesmo motivo do <app-pai> original: Angular
  // não deve tentar reconciliar o DOM pré-renderizado nesta região).
  tela: Tela;

  // Só fica preenchida quando a sessão expira sozinha (authService.sessaoExpirada$) --
  // qualquer outra navegação pra 'login' (logout manual, cancelar primeiro acesso) limpa
  // de novo, pra essa mensagem não reaparecer fora de contexto.
  mensagemLogin = '';

  constructor(private authService: AuthService) {
    this.tela = this.telaInicialAutenticado();

    this.authService.sessaoExpirada$.subscribe(() => {
      this.mensagemLogin = 'Sua sessão expirou. Faça login novamente.';
      this.tela = 'login';
    });
  }

  aoAutenticar(): void {
    this.mensagemLogin = '';
    this.tela = this.authService.isMaster() ? 'admin-perfis' : 'dashboard';
  }

  // Perfil "Administrador Master" (ver memória project-raiox-admin-perfis) nunca vê o
  // dashboard normal -- só a tela de administração de perfis, tanto no login quanto ao
  // recarregar a página com uma sessão já salva.
  private telaInicialAutenticado(): Tela {
    if (!this.authService.estaAutenticado()) {
      return 'login';
    }
    return this.authService.isMaster() ? 'admin-perfis' : 'dashboard';
  }

  irParaPrimeiroAcesso(): void {
    this.mensagemLogin = '';
    this.tela = 'primeiro-acesso';
  }

  irParaLogin(): void {
    this.mensagemLogin = '';
    this.tela = 'login';
  }

  sair(): void {
    this.authService.logout();
    this.mensagemLogin = '';
    this.tela = 'login';
  }
}
