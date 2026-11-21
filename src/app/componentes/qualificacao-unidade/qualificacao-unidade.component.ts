import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RaioxApiService } from '../../services/raiox-api.service';
import { AuthService } from '../../services/auth.service';

interface IndicadorQualificacao {
  nome: string;
  icone: string;
  necessario: number;
  atual: number;
}

// Metas fixas dadas pelo usuário (2026-08-31) — o backend não guarda nenhuma meta para
// esta tabela, só os 3 valores atuais por unidade. A Estaca Betim tem metas próprias,
// diferentes (e maiores) das de cada ala/ramo individual.
// Mudança de regra (2026-11-21): o 3º critério deixou de ser a Frequência Sacramental e passou
// a ser "Membros Participantes" (coluna membros_participantes de prioridadesprofeticas), com a
// mesma meta de antes (100 por ala/ramo, 500 para a estaca).
const METAS_ALA = { totalMembros: 250, dizimistasIntegrais: 20, membrosParticipantes: 100 };
const METAS_ESTACA_BETIM = { totalMembros: 2000, dizimistasIntegrais: 150, membrosParticipantes: 500 };
const UNIDADE_ESTACA_BETIM = 'Estaca Betim';

@Component({
  selector: 'app-qualificacao-unidade',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qualificacao-unidade.component.html',
  styleUrl: './qualificacao-unidade.component.css'
})
export class QualificacaoUnidadeComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  carregando = false;
  erroCarregamento: string | null = null;

  indicadores: IndicadorQualificacao[] = [
    { nome: 'Nº de Fichas', icone: 'bi-file-earmark-text-fill', necessario: METAS_ALA.totalMembros, atual: 0 },
    { nome: 'Élderes Dizimistas Integrais', icone: 'bi-cash-coin', necessario: METAS_ALA.dizimistasIntegrais, atual: 0 },
    { nome: 'Membros Participantes', icone: 'bi-people-fill', necessario: METAS_ALA.membrosParticipantes, atual: 0 }
  ];

  constructor(private raioxApiService: RaioxApiService, private authService: AuthService) {}

  // Card inteiro é renderizado (acordeon aparece) pro nível B, mas o conteúdo é bloqueado
  // no template - esse dado (total de fichas/dizimistas/frequência da unidade) é só pra
  // Bispados e Presidência de Estaca. Nem chama a API pra esse nível, já que o backend
  // responde 403 mesmo (ver QualificacaoUnidadeResource). Ver memória
  // project-raiox-matriz-acesso-ab-design.
  get isNivelB(): boolean {
    return this.authService.isNivelB();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade && !this.isNivelB) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    forkJoin({
      qualificacao: this.raioxApiService.buscaQualificacaoUnidade(this.unidade),
      prioridades: this.raioxApiService.buscaPrioridadesProfeticas(this.unidade)
    }).subscribe({
      next: ({ qualificacao, prioridades }) => {
        // "Estaca Betim" não tem linha própria nessas tabelas (snapshot 1-linha-por-unidade) —
        // o backend devolve as 9 alas/ramos nos dois endpoints, então a soma aqui resolve os
        // dois casos (unidade específica = 1 item, soma de 1 item = o próprio valor).
        const totalMembros = qualificacao.reduce((soma, d) => soma + Number(d.total_membros), 0);
        const dizimistasIntegrais = qualificacao.reduce((soma, d) => soma + Number(d.dizimistas_integrais), 0);
        const membrosParticipantes = prioridades.reduce((soma, d) => soma + Number(d.membros_participantes), 0);

        const metas = this.unidade === UNIDADE_ESTACA_BETIM ? METAS_ESTACA_BETIM : METAS_ALA;

        this.indicadores = [
          { nome: 'Nº de Fichas', icone: 'bi-file-earmark-text-fill', necessario: metas.totalMembros, atual: totalMembros },
          { nome: 'Élderes Dizimistas Integrais', icone: 'bi-cash-coin', necessario: metas.dizimistasIntegrais, atual: dizimistasIntegrais },
          { nome: 'Membros Participantes', icone: 'bi-people-fill', necessario: metas.membrosParticipantes, atual: membrosParticipantes }
        ];
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de qualificação da unidade.';
        this.carregando = false;
        console.error('Erro ao buscar qualificação da unidade:', err);
      },
    });
  }

  cumprido(item: IndicadorQualificacao): boolean {
    return item.atual >= item.necessario;
  }

  faltam(item: IndicadorQualificacao): number {
    return Math.max(item.necessario - item.atual, 0);
  }

  // A unidade só é qualificada se os 3 indicadores atingirem o valor necessário
  get isQualificada(): boolean {
    return this.indicadores.every(item => this.cumprido(item));
  }

  get resultadoTexto(): string {
    return this.isQualificada ? 'Resultado: Unidade qualificada' : 'Resultado: Unidade NÃO qualificada';
  }
}
