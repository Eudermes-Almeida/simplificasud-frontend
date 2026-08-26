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

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }
}
