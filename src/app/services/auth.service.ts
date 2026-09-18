import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  nome: string;
  unidade: string;
  escopo: string;
}

export interface IdentificacaoResponse {
  id: number;
  nome: string;
}

const CHAVE_SESSAO = 'raiox_sessao';

// Sessão simples (token opaco em header X-Auth-Token), não JWT — ver memória
// project-raiox-auth-design. Guardada em localStorage (sobrevive a fechar o navegador,
// já que a sessão no backend não expira automaticamente por decisão de projeto).
// Toda leitura/escrita de localStorage é guardada com typeof-check porque este app tem
// SSR (prerender) — localStorage não existe no servidor.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessao: LoginResponse | null = null;

  // Emitido pelo authInterceptor quando uma chamada autenticada volta 401 (sessão
  // expirada no backend, 60 min desde o login — ver SessaoService). AppComponent escuta
  // isso pra voltar pra tela de login com uma mensagem, em vez de deixar a seção do
  // dashboard simplesmente falhar sem explicação.
  private sessaoExpiradaSubject = new Subject<void>();
  sessaoExpirada$ = this.sessaoExpiradaSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarSessaoSalva();
  }

  estaAutenticado(): boolean {
    return !!this.sessao?.token;
  }

  getToken(): string | null {
    return this.sessao?.token ?? null;
  }

  getNome(): string {
    return this.sessao?.nome ?? '';
  }

  getUnidade(): string {
    return this.sessao?.unidade ?? '';
  }

  getEscopo(): string {
    return this.sessao?.escopo ?? '';
  }

  // Nível B = "Conselho"/"Sumo Conselho"/"Professores" (escopo termina em "-B", ex.
  // "Estaca-B"/"Ala-B") — restringe status de recomendação e o card de Qualificação de
  // Unidade. Ver memória project-raiox-matriz-acesso-ab-design. Mesmo enforcement já
  // existe no backend (ContextoAutenticacao.isNivelB) — aqui é só pra adaptar a UI,
  // o dado sensível já nem chega na resposta da API pro nível B.
  isNivelB(): boolean {
    return this.getEscopo().trim().toLowerCase().endsWith('-b');
  }

  login(login: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { login, senha })
      .pipe(tap(resposta => this.salvarSessao(resposta)));
  }

  logout(): void {
    const token = this.getToken();
    this.limparSessaoLocal();
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { headers: { 'X-Auth-Token': token } }).subscribe();
    }
  }

  // Chamado só pelo authInterceptor quando o backend rejeita um token que a gente
  // achava válido -- diferente do logout normal, não faz sentido chamar POST
  // /auth/logout aqui (o próprio motivo de estar aqui é o backend já ter descartado essa
  // sessão sozinho).
  marcarSessaoExpirada(): void {
    this.limparSessaoLocal();
    this.sessaoExpiradaSubject.next();
  }

  private limparSessaoLocal(): void {
    this.sessao = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CHAVE_SESSAO);
    }
  }

  identificar(nascimento: string, ultimosQuatroRegistro: string): Observable<IdentificacaoResponse> {
    return this.http.post<IdentificacaoResponse>(`${environment.apiUrl}/lideres/identificar`, {
      nascimento,
      ultimosQuatroRegistro,
    });
  }

  cadastrarCredenciais(id: number, login: string, senha: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/lideres/cadastrar-credenciais`, { id, login, senha });
  }

  private carregarSessaoSalva(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) {
      return;
    }
    try {
      this.sessao = JSON.parse(bruto);
    } catch {
      this.sessao = null;
    }
  }

  private salvarSessao(resposta: LoginResponse): void {
    this.sessao = resposta;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(resposta));
    }
  }
}
