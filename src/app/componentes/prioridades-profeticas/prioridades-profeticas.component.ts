import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type ColunaAba = 'atual' | 'meta' | 'falta';

interface PrioridadeItem {
  nome: string;
  icone: string;
  atual: number | null;
  meta: number;
  falta: number | null;
}

interface AreaPrioridade {
  area: string;
  subtitulo: string;
  itens: PrioridadeItem[];
}

@Component({
  selector: 'app-prioridades-profeticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prioridades-profeticas.component.html',
  styleUrl: './prioridades-profeticas.component.css'
})
export class PrioridadesProfeticasComponent {
  abaAtiva: ColunaAba = 'atual';

  // Dados extraídos fielmente da tabela "Prioridades Proféticas"
  areas: AreaPrioridade[] = [
    {
      area: 'VIVER',
      subtitulo: 'O Evangelho de Jesus Cristo',
      itens: [
        { nome: 'Frequência Sacramental', icone: 'bi-people-fill', atual: 27, meta: 55, falta: 28 },
        { nome: 'Membros Participantes', icone: 'bi-person-check-fill', atual: 35, meta: 65, falta: 30 }
      ]
    },
    {
      area: 'CUIDAR',
      subtitulo: 'dos necessitados',
      itens: [
        { nome: 'Membros Retornando', icone: 'bi-arrow-repeat', atual: null, meta: 8, falta: null },
        { nome: 'Membros Jejuando', icone: 'bi-moon-stars-fill', atual: 5, meta: 15, falta: 10 }
      ]
    },
    {
      area: 'CONVIDAR',
      subtitulo: 'Todos a receber o evangelho',
      itens: [
        { nome: 'Batismo Conversos', icone: 'bi-droplet-fill', atual: 4, meta: 12, falta: 8 },
        { nome: 'Missionários Servindo', icone: 'bi-globe-americas', atual: 1, meta: 2, falta: 1 }
      ]
    },
    {
      area: 'UNIR',
      subtitulo: 'as famílias por toda a eternidade',
      itens: [
        { nome: 'Recomendação Templo', icone: 'bi-bank2', atual: 10, meta: 15, falta: 5 },
        { nome: 'Recomendação Batistério', icone: 'bi-droplet-half', atual: 5, meta: 10, falta: 5 }
      ]
    }
  ];

  mudarAba(aba: ColunaAba): void {
    this.abaAtiva = aba;
  }

  valorExibido(item: PrioridadeItem): string {
    const valor = item[this.abaAtiva];
    return valor === null ? '—' : String(valor);
  }

  // Vermelho/verde só valem na aba Falta; nas outras o card fica neutro.
  // Sem "Atual" não dá pra saber se falta algo, então também fica neutro.
  corClasse(item: PrioridadeItem): string {
    if (this.abaAtiva !== 'falta' || item.falta === null) {
      return '';
    }
    return item.falta > 0 ? 'rx-kpi-negativo' : 'rx-kpi-positivo';
  }
}
