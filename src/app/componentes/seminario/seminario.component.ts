import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seminario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seminario.component.html',
  styleUrl: './seminario.component.css'
})
export class SeminarioComponent {
  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  // Dados reais extraídos da imagem do Seminário
  resumoSeminario = {
    totalJovensAla: 53,
    totalMatriculados: { valor: 9, pct: 17 },
    frequenciaAcima75: { valor: 2, pct: 22 },
    frequenciaAbaixo75: { valor: 7, pct: 78 },
    frequenciaMediaTurma: 41
  };

  // Alunos matriculados no Seminário (aba Detalhes)
  detalhesSeminario = [
    { nome: 'Batista, Gabriel Andrade', sexo: 'M', idade: 14, frequenciaPct: 21, dataUltimaPresenca: '2026-08-16' },
    { nome: 'Santos, Theylor Jordan', sexo: 'M', idade: 14, frequenciaPct: 26, dataUltimaPresenca: '2026-08-16' },
    { nome: 'Oliveira, Saulo Balsamão Martins de', sexo: 'M', idade: 17, frequenciaPct: 29, dataUltimaPresenca: '2026-05-24' },
    { nome: 'Gaspar, Miguel', sexo: 'M', idade: 15, frequenciaPct: 4, dataUltimaPresenca: '2026-03-08' },
    { nome: 'Freitas, Gabriel Nunes', sexo: 'M', idade: 14, frequenciaPct: 46, dataUltimaPresenca: '2026-08-16' },
    { nome: 'Oliveira, Esther Balsamão Martins de', sexo: 'F', idade: 14, frequenciaPct: 6, dataUltimaPresenca: '2026-03-08' },
    { nome: 'Vilaça, Karen Teixeira', sexo: 'F', idade: 16, frequenciaPct: 73, dataUltimaPresenca: '2026-08-16' },
    { nome: 'Barbosa, Hellen Lana', sexo: 'F', idade: 14, frequenciaPct: 80, dataUltimaPresenca: '2026-08-16' },
    { nome: 'Isaque de Souza, Heique', sexo: 'M', idade: 15, frequenciaPct: 88, dataUltimaPresenca: '2026-08-16' }
  ];

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
