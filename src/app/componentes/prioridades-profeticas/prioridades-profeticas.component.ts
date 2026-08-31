import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrioridadesProfeticasDTO, RaioxApiService } from '../../services/raiox-api.service';

type ColunaAba = 'atual' | 'meta' | 'falta';

interface PrioridadeItem {
  nome: string;
  icone: string;
  atual: number;
  meta: number;
}

interface AreaPrioridade {
  area: string;
  subtitulo: string;
  itens: PrioridadeItem[];
}

// Ordem alinhada 1:1 com os 8 itens de `areas` abaixo (flatMap na mesma ordem) — usada pra
// mapear os 16 campos planos da API pra cada item sem depender de nomes dinâmicos.
const CAMPOS_API: { atual: keyof PrioridadesProfeticasDTO; meta: keyof PrioridadesProfeticasDTO }[] = [
  { atual: 'frequencia', meta: 'meta_frequencia' },
  { atual: 'membros_participantes', meta: 'meta_membros_participantes' },
  { atual: 'membros_retornando', meta: 'meta_membros_retornando' },
  { atual: 'membros_jejuando', meta: 'meta_membros_jejuando' },
  { atual: 'batismos_conversos', meta: 'meta_batismos_conversos' },
  { atual: 'missionarios', meta: 'meta_missionarios' },
  { atual: 'recomendacao_templo', meta: 'meta_recomendacao_templo' },
  { atual: 'recomendacao_batisterio', meta: 'meta_recomendacao_batisterio' },
];

@Component({
  selector: 'app-prioridades-profeticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prioridades-profeticas.component.html',
  styleUrl: './prioridades-profeticas.component.css'
})
export class PrioridadesProfeticasComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  abaAtiva: ColunaAba = 'atual';

  carregando = false;
  erroCarregamento: string | null = null;

  // Metadados (nome/ícone/agrupamento) fixos — só atual/meta vêm da API.
  areas: AreaPrioridade[] = [
    {
      area: 'VIVER',
      subtitulo: 'O Evangelho de Jesus Cristo',
      itens: [
        { nome: 'Frequência Sacramental', icone: 'bi-people-fill', atual: 0, meta: 0 },
        { nome: 'Membros Participantes', icone: 'bi-person-check-fill', atual: 0, meta: 0 }
      ]
    },
    {
      area: 'CUIDAR',
      subtitulo: 'dos necessitados',
      itens: [
        { nome: 'Membros Retornando', icone: 'bi-arrow-repeat', atual: 0, meta: 0 },
        { nome: 'Membros Jejuando', icone: 'bi-moon-stars-fill', atual: 0, meta: 0 }
      ]
    },
    {
      area: 'CONVIDAR',
      subtitulo: 'Todos a receber o evangelho',
      itens: [
        { nome: 'Batismo Conversos', icone: 'bi-droplet-fill', atual: 0, meta: 0 },
        { nome: 'Missionários Servindo', icone: 'bi-globe-americas', atual: 0, meta: 0 }
      ]
    },
    {
      area: 'UNIR',
      subtitulo: 'as famílias por toda a eternidade',
      itens: [
        { nome: 'Recomendação Templo', icone: 'bi-bank2', atual: 0, meta: 0 },
        { nome: 'Recomendação Batistério', icone: 'bi-droplet-half', atual: 0, meta: 0 }
      ]
    }
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

    this.raioxApiService.buscaPrioridadesProfeticas(this.unidade).subscribe({
      next: (dados) => {
        // "Estaca Betim" não tem linha própria nessa tabela (snapshot 1-linha-por-unidade) —
        // o backend devolve as 9 alas/ramos, então a soma aqui resolve os dois casos (unidade
        // específica = 1 item, soma de 1 item = o próprio valor) sem "if" separado. Soma tanto
        // o atual quanto a meta: a meta da estaca é a soma das metas de cada ala/ramo.
        const itens = this.areas.flatMap(area => area.itens);
        CAMPOS_API.forEach((campo, i) => {
          itens[i].atual = dados.reduce((soma, d) => soma + Number(d[campo.atual]), 0);
          itens[i].meta = dados.reduce((soma, d) => soma + Number(d[campo.meta]), 0);
        });
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de prioridades proféticas.';
        this.carregando = false;
        console.error('Erro ao buscar prioridades proféticas:', err);
      },
    });
  }

  mudarAba(aba: ColunaAba): void {
    this.abaAtiva = aba;
  }

  faltam(item: PrioridadeItem): number {
    return Math.max(item.meta - item.atual, 0);
  }

  valorExibido(item: PrioridadeItem): string {
    return this.abaAtiva === 'falta' ? String(this.faltam(item)) : String(item[this.abaAtiva]);
  }

  // Vermelho/verde só valem na aba Falta; nas outras o card fica neutro.
  corClasse(item: PrioridadeItem): string {
    if (this.abaAtiva !== 'falta') {
      return '';
    }
    return this.faltam(item) > 0 ? 'rx-kpi-negativo' : 'rx-kpi-positivo';
  }
}
