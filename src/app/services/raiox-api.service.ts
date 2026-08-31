import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FrequenciaSacramentalDTO {
  id: number;
  unidade: string;
  anomes: string;
  frequencia: string;
}

// Service único para todas as chamadas HTTP ao backend Quarkus (SIMPLIFICASUD) —
// cada tabela nova ganha aqui seu próprio método buscaXxx, todos devolvendo Observable.
@Injectable({ providedIn: 'root' })
export class RaioxApiService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  buscaFrequenciaSacramental(unidade: string): Observable<FrequenciaSacramentalDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<FrequenciaSacramentalDTO[]>(`${this.baseUrl}/frequenciasacramental`, { params });
  }
}
