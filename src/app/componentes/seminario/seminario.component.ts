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

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

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
}
