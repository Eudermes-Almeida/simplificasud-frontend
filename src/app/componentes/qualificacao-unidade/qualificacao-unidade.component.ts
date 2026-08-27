import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IndicadorQualificacao {
  nome: string;
  icone: string;
  necessario: number;
  atual: number;
}

@Component({
  selector: 'app-qualificacao-unidade',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qualificacao-unidade.component.html',
  styleUrl: './qualificacao-unidade.component.css'
})
export class QualificacaoUnidadeComponent {
  // Indicadores extraídos fielmente da imagem da planilha
  indicadores: IndicadorQualificacao[] = [
    { nome: 'Nº de Fichas', icone: 'bi-file-earmark-text-fill', necessario: 250, atual: 414 },
    { nome: 'Élderes Dizimistas Integrais', icone: 'bi-cash-coin', necessario: 20, atual: 3 },
    { nome: 'Frequência Sacramental', icone: 'bi-people-fill', necessario: 100, atual: 27 }
  ];

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
    return this.isQualificada ? 'Resultado: Ala qualificada' : 'Resultado: Ala NÃO qualificada';
  }
}
