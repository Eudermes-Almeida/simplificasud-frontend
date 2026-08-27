import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type AbaReunioes = 'reunioes' | 'lancamentos' | 'entrevistas' | 'atividades';

interface ItemChecklist {
  nome: string;
  icone: string;
  feito: boolean;
}

interface ItemEntrevista {
  nome: string;
  icone: string;
  feitos: number;
  total: number;
}

@Component({
  selector: 'app-reunioes-atividades-lancamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reunioes-atividades-lancamentos.component.html',
  styleUrl: './reunioes-atividades-lancamentos.component.css'
})
export class ReunioesAtividadesLancamentosComponent {
  abaAtiva: AbaReunioes = 'reunioes';

  // Dados extraídos fielmente da planilha
  reunioes: ItemChecklist[] = [
    { nome: 'Reunião Presidência Quórum', icone: 'bi-person-badge-fill', feito: true },
    { nome: 'Reunião Presidência Soc Soc', icone: 'bi-person-hearts', feito: true },
    { nome: 'Reunião Conselho da ala', icone: 'bi-diagram-3-fill', feito: false },
    { nome: 'Reunião THF', icone: 'bi-clock-history', feito: true },
    { nome: 'Reunião Correlação Missionária', icone: 'bi-compass-fill', feito: false }
  ];

  lancamentos: ItemChecklist[] = [
    { nome: 'Lançamento Frequência Sacramental', icone: 'bi-cup-fill', feito: true },
    { nome: 'Lançamento Frequência Quórum', icone: 'bi-person-badge-fill', feito: false },
    { nome: 'Lançamento Frequência Soc Soc', icone: 'bi-person-hearts', feito: true },
    { nome: 'Lançamento Frequência Moças', icone: 'bi-gem', feito: true },
    { nome: 'Lançamento Frequência Rapazes', icone: 'bi-shield-fill', feito: false },
    { nome: 'Lançamento Frequência Primária', icone: 'bi-emoji-smile-fill', feito: true }
  ];

  entrevistas: ItemEntrevista[] = [
    { nome: 'Entrevistas Ministração Quórum', icone: 'bi-chat-square-text-fill', feitos: 6, total: 6 },
    { nome: 'Entrevistas Ministração Soc Soc', icone: 'bi-chat-square-text-fill', feitos: 0, total: 5 }
  ];

  atividades: ItemChecklist[] = [
    { nome: 'Mutuais Jovens', icone: 'bi-stars', feito: false },
    { nome: 'Projeto Serviço Quórum', icone: 'bi-heart-fill', feito: true },
    { nome: 'Projeto Serviço Soc Soc', icone: 'bi-heart-fill', feito: false },
    { nome: 'Atividades da Primária', icone: 'bi-balloon-fill', feito: true }
  ];

  mudarAba(aba: AbaReunioes): void {
    this.abaAtiva = aba;
  }

  // Regra combinada para o card de checklist e o de fração:
  // checklist -> feito/não feito; fração -> >=50% cumprido é ok, abaixo é pendente
  seloClasse(item: ItemChecklist | ItemEntrevista): string {
    if ('feito' in item) {
      return item.feito ? 'rx-selo-ok' : 'rx-selo-pendente';
    }
    const percentual = item.total === 0 ? 0 : item.feitos / item.total;
    return percentual >= 0.5 ? 'rx-selo-ok' : 'rx-selo-pendente';
  }
}
