import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LiderAdmin {
  id?: number;
  nome: string;
  registromembro: string;
  unidade: string;
  escopo: string;
  nascimento: string; // yyyy-MM-dd
  chamado: string;
}

// CRUD de perfis (lideres) usado só pela tela do perfil Master -- ver memória
// project-raiox-admin-perfis. O X-Auth-Token é anexado automaticamente pelo
// authInterceptor, igual a qualquer outra chamada autenticada; o backend (AutorizacaoFilter)
// é quem garante que só uma sessão com escopo Master chega nessas rotas.
@Injectable({ providedIn: 'root' })
export class AdminPerfisService {
  constructor(private http: HttpClient) {}

  buscarPorRegistroMembro(registromembro: string): Observable<LiderAdmin> {
    return this.http.get<LiderAdmin>(`${environment.apiUrl}/lideres/admin/${encodeURIComponent(registromembro)}`);
  }

  criar(lider: LiderAdmin): Observable<LiderAdmin> {
    return this.http.post<LiderAdmin>(`${environment.apiUrl}/lideres/admin`, lider);
  }

  atualizar(id: number, lider: LiderAdmin): Observable<LiderAdmin> {
    return this.http.put<LiderAdmin>(`${environment.apiUrl}/lideres/admin/${id}`, lider);
  }

  revogarAcesso(id: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/lideres/admin/${id}/revogar-acesso`, {});
  }
}
