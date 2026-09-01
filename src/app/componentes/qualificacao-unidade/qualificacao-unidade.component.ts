import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaioxApiService } from '../../services/raiox-api.service';

interface IndicadorQualificacao {
  nome: string;
  icone: string;
  necessario: number;
  atual: number;
}

// Metas fixas dadas pelo usuário (2026-08-31) — o backend não guarda nenhuma meta para
// esta tabela, só os 3 valores atuais por unidade. A Estaca Betim tem metas próprias,
// diferentes (e maiores) das de cada ala/ramo individual.
const METAS_ALA = { totalMembros: 250, dizimistasIntegrais: 20, frequenciaSacramental: 100 };
const METAS_ESTACA_BETIM = { totalMembros: 2000, dizimistasIntegrais: 150, frequenciaSacramental: 1000 };
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
    { nome: 'Frequência Sacramental', icone: 'bi-people-fill', necessario: METAS_ALA.frequenciaSacramental, atual: 0 }
  ];

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    this.raioxApiService.buscaQualificacaoUnidade(this.unidade).subscribe({
      next: (dados) => {
        // "Estaca Betim" não tem linha própria nessa tabela (é snapshot 1-linha-por-unidade) —
        // o backend devolve as 9 alas/ramos, então a soma aqui resolve os dois casos (unidade
        // específica = 1 item, soma de 1 item = o próprio valor) sem precisar de um
        // "if unidade === Estaca Betim" separado. frequencia_sacramental é uma contagem de
        // presença (não percentual, apesar do nome) — mesma grandeza de [[frequenciasacramental]],
        // então soma igual aos outros dois campos (confirmado: soma das 9 unidades = 580,
        // batendo com o "atual" já verificado na seção Frequência Sacramental).
        const totalMembros = dados.reduce((soma, d) => soma + Number(d.total_membros), 0);
        const dizimistasIntegrais = dados.reduce((soma, d) => soma + Number(d.dizimistas_integrais), 0);
        const frequenciaSacramental = dados.reduce((soma, d) => soma + Number(d.frequencia_sacramental), 0);

        const metas = this.unidade === UNIDADE_ESTACA_BETIM ? METAS_ESTACA_BETIM : METAS_ALA;

        this.indicadores = [
          { nome: 'Nº de Fichas', icone: 'bi-file-earmark-text-fill', necessario: metas.totalMembros, atual: totalMembros },
          { nome: 'Élderes Dizimistas Integrais', icone: 'bi-cash-coin', necessario: metas.dizimistasIntegrais, atual: dizimistasIntegrais },
          { nome: 'Frequência Sacramental', icone: 'bi-people-fill', necessario: metas.frequenciaSacramental, atual: frequenciaSacramental }
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
