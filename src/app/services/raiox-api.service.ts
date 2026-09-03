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

export interface DetalhesConversosDTO {
  id: number;
  unidade: string;
  nome: string;
  sexo: string;
  idade: string;
  ativo: string;
  tem_chamado: string;
  ministradora: string;
  ministrador: string;
  recomendacao: string;
  sacerdocio: string;
}

export interface RapazesDTO {
  id: number;
  unidade: string;
  nome: string;
  idade: string;
  sacerdocio: string;
  recomendacao_batisterio: string;
}

export interface MocasDTO {
  id: number;
  unidade: string;
  nome: string;
  idade: string;
  recomendacao_batisterio: string;
}

export interface CriancasDTO {
  id: number;
  unidade: string;
  nome: string;
  sexo: string;
  idade: string;
}

export interface QualificacaoUnidadeDTO {
  id: number;
  unidade: string;
  total_membros: string;
  frequencia_sacramental: string;
  dizimistas_integrais: string;
}

export interface HomensPreparadosDTO {
  id: number;
  unidade: string;
  nome: string;
  idade: string;
  ativo: string;
}

export interface PrioridadesProfeticasDTO {
  id: number;
  unidade: string;
  frequencia: string;
  meta_frequencia: string;
  membros_participantes: string;
  meta_membros_participantes: string;
  membros_retornando: string;
  meta_membros_retornando: string;
  membros_jejuando: string;
  meta_membros_jejuando: string;
  batismos_conversos: string;
  meta_batismos_conversos: string;
  missionarios: string;
  meta_missionarios: string;
  recomendacao_templo: string;
  meta_recomendacao_templo: string;
  recomendacao_batisterio: string;
  meta_recomendacao_batisterio: string;
}

export interface SeminarioDTO {
  id: number;
  unidade: string;
  nome: string;
  sexo: string;
  idade: string;
  percentual_frequencia: string;
  data_ultima_presenca: string;
}

export interface ResumoJovensDTO {
  id: number;
  unidade: string;
  rapazes_total: string;
  rapazes_ativos: string;
  mocas_total: string;
  mocas_ativas: string;
  criancas_0_a_2: string;
  criancas_3_a_11_potencial: string;
  criancas_total_ativas: string;
  total_criancas: string;
  total_matriculados_seminario: string;
  frequencia_acima_75: string;
  rapazes_recomendacao_batisterio: string;
  mocas_recomendacao_batisterio: string;
}

export interface MissionariosRetornadosDTO {
  id: number;
  unidade: string;
  nome: string;
  sexo: string;
  idade: string;
  solteiro: string;
  selado: string;
  matriculadoinstituto: string;
  recomendacaotemplo: string;
  chamado: string;
  paismissao: string;
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

  buscaDetalhesConversos(unidade: string): Observable<DetalhesConversosDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<DetalhesConversosDTO[]>(`${this.baseUrl}/detalhesconversos`, { params });
  }

  buscaRapazes(unidade: string): Observable<RapazesDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<RapazesDTO[]>(`${this.baseUrl}/rapazes`, { params });
  }

  buscaMocas(unidade: string): Observable<MocasDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<MocasDTO[]>(`${this.baseUrl}/mocas`, { params });
  }

  buscaCriancas(unidade: string): Observable<CriancasDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<CriancasDTO[]>(`${this.baseUrl}/criancas`, { params });
  }

  buscaQualificacaoUnidade(unidade: string): Observable<QualificacaoUnidadeDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<QualificacaoUnidadeDTO[]>(`${this.baseUrl}/qualificacaounidade`, { params });
  }

  buscaHomensPreparados(unidade: string): Observable<HomensPreparadosDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<HomensPreparadosDTO[]>(`${this.baseUrl}/homenspreparados`, { params });
  }

  buscaPrioridadesProfeticas(unidade: string): Observable<PrioridadesProfeticasDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<PrioridadesProfeticasDTO[]>(`${this.baseUrl}/prioridadesprofeticas`, { params });
  }

  buscaResumoJovens(unidade: string): Observable<ResumoJovensDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<ResumoJovensDTO[]>(`${this.baseUrl}/resumojovens`, { params });
  }

  buscaSeminario(unidade: string): Observable<SeminarioDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<SeminarioDTO[]>(`${this.baseUrl}/seminario`, { params });
  }

  buscaMissionariosRetornados(unidade: string): Observable<MissionariosRetornadosDTO[]> {
    const params = new HttpParams().set('unidade', unidade);
    return this.http.get<MissionariosRetornadosDTO[]>(`${this.baseUrl}/missionariosretornados`, { params });
  }
}
