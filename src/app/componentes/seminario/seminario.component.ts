import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RaioxApiService } from '../../services/raiox-api.service';

interface AlunoSeminario {
  nome: string;
  sexo: string;
  idade: number;
  unidade: string;
  frequenciaPct: number;
  dataUltimaPresenca: string;
}

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo) — mesmo padrão de
// homens-avancando-sacerdocio.component.ts/recem-conversos.component.ts.
type FiltroDetalhe = 'acima75' | 'abaixo75' | null;

@Component({
  selector: 'app-seminario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seminario.component.html',
  styleUrl: './seminario.component.css'
})
export class SeminarioComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — recalculados a cada busca (ver buscarDados).
  resumoSeminario = {
    totalJovensAla: 0,
    totalMatriculados: { valor: 0, pct: 0 },
    frequenciaAcima75: { valor: 0, pct: 0 },
    frequenciaAbaixo75: { valor: 0, pct: 0 },
    frequenciaMediaTurma: 0
  };

  // Alunos matriculados no Seminário (aba Detalhes)
  detalhesSeminario: AlunoSeminario[] = [];

  // Filtro acionado pelo botão "Detalhes" dos cards do Resumo — a aba Detalhes usa isso pra
  // restringir a listagem em vez de sempre mostrar todo mundo.
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    acima75: 'Frequência acima de 75%',
    abaixo75: 'Frequência abaixo de 75%',
  };

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;
    this.filtroAtivo = null;

    forkJoin({
      seminario: this.raioxApiService.buscaSeminario(this.unidade),
      rapazes: this.raioxApiService.buscaRapazes(this.unidade),
      mocas: this.raioxApiService.buscaMocas(this.unidade),
    }).subscribe({
      next: ({ seminario, rapazes, mocas }) => {
        // "Total de Jovens Ala" não existe na tabela seminario (que só lista os já matriculados) —
        // aproximado como rapazes+moças da unidade, por decisão explícita do usuário (não filtra
        // por faixa etária elegível ao seminário, então é uma aproximação, não um número exato).
        const totalJovensAla = rapazes.length + mocas.length;

        const frequencias = seminario.map(dto => this.parsePercentual(dto.percentual_frequencia));
        const totalMatriculados = seminario.length;
        const acima75 = frequencias.filter(pct => pct >= 75).length;
        const mediaTurma = totalMatriculados > 0
          ? Math.round(frequencias.reduce((soma, pct) => soma + pct, 0) / totalMatriculados)
          : 0;

        const pctSobre = (contagem: number, total: number) => total > 0 ? Math.round((contagem / total) * 100) : 0;

        this.resumoSeminario = {
          totalJovensAla,
          totalMatriculados: { valor: totalMatriculados, pct: pctSobre(totalMatriculados, totalJovensAla) },
          frequenciaAcima75: { valor: acima75, pct: pctSobre(acima75, totalMatriculados) },
          frequenciaAbaixo75: { valor: totalMatriculados - acima75, pct: pctSobre(totalMatriculados - acima75, totalMatriculados) },
          frequenciaMediaTurma: mediaTurma,
        };

        this.detalhesSeminario = seminario.map(dto => ({
          nome: dto.nome,
          sexo: dto.sexo,
          idade: Number(dto.idade),
          unidade: dto.unidade,
          frequenciaPct: this.parsePercentual(dto.percentual_frequencia),
          dataUltimaPresenca: dto.data_ultima_presenca,
        }));

        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de seminário.';
        this.carregando = false;
        console.error('Erro ao buscar seminário/rapazes/moças:', err);
      },
    });
  }

  // O backend devolve o percentual já com o símbolo embutido (ex: "62%"), não um número puro.
  private parsePercentual(valor: string): number {
    return Number(valor.replace('%', ''));
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }

  // >=75% é positivo (verde); abaixo disso é negativo (vermelho)
  frequenciaClasse(pct: number): string {
    return pct >= 75 ? 'rx-campo-positivo' : 'rx-campo-negativo';
  }

  frequenciaIcone(pct: number): string {
    return pct >= 75 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow';
  }

  // Lista efetivamente exibida na aba Detalhes — aplica o filtro do card clicado no Resumo
  // (ou mostra todo mundo quando não há filtro ativo, inclusive vindo do card "Total de
  // matriculados").
  get detalhesFiltrados(): AlunoSeminario[] {
    switch (this.filtroAtivo) {
      case 'acima75':
        return this.detalhesSeminario.filter(a => a.frequenciaPct >= 75);
      case 'abaixo75':
        return this.detalhesSeminario.filter(a => a.frequenciaPct < 75);
      default:
        return this.detalhesSeminario;
    }
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? SeminarioComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Detalhes" dos cards do Resumo — troca de aba e já aplica o filtro
  // correspondente. `null` (card "Total de matriculados") só troca de aba, sem filtrar.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }
}
