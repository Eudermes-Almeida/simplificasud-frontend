import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalhesConversosDTO, RaioxApiService } from '../../services/raiox-api.service';

interface ConversoDetalhe {
  nome: string;
  idade: number;
  unidade: string;
  ativo: boolean;
  chamado: boolean;
  ministrador: boolean;
  recomendacao: string;
  sacerdocio: string;
}

interface ConversoMinistracao {
  nome: string;
  sexo: string;
  ministrador: string[];
  ministradora: string[];
}

@Component({
  selector: 'app-recem-conversos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recem-conversos.component.html',
  styleUrl: './recem-conversos.component.css'
})
export class RecemConversosComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — todos derivados da lista bruta vinda da API,
  // recalculados a cada busca (ver buscarDados/calcularResumo).
  resumoConversos = {
    qtBatismos: { valor: 0, pct: 100 },
    ativos: { valor: 0, pct: 0 },
    sexoMasculino: { valor: 0, pct: 0 },
    ordenandosSacerdocio: { valor: 0, pct: 0 },
    comRecomendacaoTemplos: { valor: 0, pct: 0 },
    receberamChamado: { valor: 0, pct: 0 },
    comMinistradores: { valor: 0, pct: 0 }
  };

  // Lista de recém-conversos (fonte única usada pela tabela da aba Detalhes)
  detalhesConversos: ConversoDetalhe[] = [];

  // Ministradores designados por recém-converso (fonte única usada pelos cards da aba Ministradores)
  // "sexo" define se o card de Ministradora é renderizado: homens só têm Ministrador.
  ministradoresConversos: ConversoMinistracao[] = [];

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    this.raioxApiService.buscaDetalhesConversos(this.unidade).subscribe({
      next: (dados) => {
        // O backend omite a chave inteira (JSON-B) quando sacerdocio/recomendacao/ministrador/
        // ministradora vêm nulos no banco — normaliza para as strings de convenção já usadas no
        // resto do dado (single source of truth) antes de qualquer contagem/mapeamento, para
        // nunca tratar "em branco" como se fosse um valor real (ex: um sacerdocio ausente não
        // pode contar como "ordenado", um ministrador ausente não pode virar undefined.split()).
        const dadosNormalizados = dados.map(dto => ({
          ...dto,
          sacerdocio: dto.sacerdocio || 'Não se aplica',
          recomendacao: dto.recomendacao || 'Não Emitida',
          ministrador: dto.ministrador || 'Não designado',
          ministradora: dto.ministradora || 'Não designado',
        }));

        this.resumoConversos = this.calcularResumo(dadosNormalizados);
        this.detalhesConversos = dadosNormalizados.map(dto => this.mapDetalhe(dto));
        this.ministradoresConversos = dadosNormalizados.map(dto => this.mapMinistracao(dto));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de recém-conversos.';
        this.carregando = false;
        console.error('Erro ao buscar detalhes de conversos:', err);
      },
    });
  }

  private calcularResumo(dados: DetalhesConversosDTO[]): typeof this.resumoConversos {
    const total = dados.length;
    const pct = (contagem: number) => total > 0 ? Math.round((contagem / total) * 100) : 0;

    const ativos = dados.filter(d => d.ativo === 'Sim').length;
    const sexoMasculino = dados.filter(d => d.sexo === 'M').length;
    const ordenandosSacerdocio = dados.filter(d => d.sacerdocio !== 'Não ordenado' && d.sacerdocio !== 'Não se aplica').length;
    const comRecomendacaoTemplos = dados.filter(d => this.recomendacaoEmitida(d.recomendacao)).length;
    const receberamChamado = dados.filter(d => d.tem_chamado === 'Sim').length;
    const comMinistradores = dados.filter(d => this.temMinistracao(d)).length;

    return {
      qtBatismos: { valor: total, pct: 100 },
      ativos: { valor: ativos, pct: pct(ativos) },
      sexoMasculino: { valor: sexoMasculino, pct: pct(sexoMasculino) },
      ordenandosSacerdocio: { valor: ordenandosSacerdocio, pct: pct(ordenandosSacerdocio) },
      comRecomendacaoTemplos: { valor: comRecomendacaoTemplos, pct: pct(comRecomendacaoTemplos) },
      receberamChamado: { valor: receberamChamado, pct: pct(receberamChamado) },
      comMinistradores: { valor: comMinistradores, pct: pct(comMinistradores) },
    };
  }

  private mapDetalhe(dto: DetalhesConversosDTO): ConversoDetalhe {
    return {
      nome: dto.nome,
      idade: Number(dto.idade),
      unidade: dto.unidade,
      ativo: dto.ativo === 'Sim',
      chamado: dto.tem_chamado === 'Sim',
      ministrador: this.temMinistracao(dto),
      recomendacao: dto.recomendacao,
      sacerdocio: dto.sacerdocio,
    };
  }

  // Valores de "sem designação" já usados na origem em momentos diferentes — a planilha trocou
  // o vocabulário em 2026-09 ("Sem Designação"→"Não designado", "null"→"Null") sem aviso prévio,
  // e o código antigo só reconhecia os termos velhos (bug real: recém-converso sem nenhum
  // ministrador/ministradora contava como "tem ministração"). Aceita os dois conjuntos pra não
  // quebrar de novo se a planilha oscilar entre convenções.
  private static readonly SEM_DESIGNACAO = ['Sem Designação', 'Não designado'];
  private static readonly SEM_MINISTRADORA_HOMEM = ['null', 'Null'];

  private semDesignacao(valor: string): boolean {
    return RecemConversosComponent.SEM_DESIGNACAO.includes(valor);
  }

  // Tem ministração se houver um ministrador OU uma ministradora designados — homens só têm
  // ministrador (o campo "ministradora" vem com um placeholder de "não se aplica" na origem
  // pra eles, nunca uma designação real).
  private temMinistracao(dto: DetalhesConversosDTO): boolean {
    const semMinistradora = this.semDesignacao(dto.ministradora) || RecemConversosComponent.SEM_MINISTRADORA_HOMEM.includes(dto.ministradora);
    return !this.semDesignacao(dto.ministrador) || !semMinistradora;
  }

  // "Sem designação" (nenhum ministrador/ministradora) e o placeholder do campo Ministradora em
  // registros masculinos viram lista vazia — nunca um nome de fato.
  private mapMinistracao(dto: DetalhesConversosDTO): ConversoMinistracao {
    const paraLista = (valor: string) =>
      (this.semDesignacao(valor) || RecemConversosComponent.SEM_MINISTRADORA_HOMEM.includes(valor))
        ? []
        : valor.split(',').map(nome => nome.trim());

    return {
      nome: dto.nome,
      sexo: dto.sexo,
      ministrador: paraLista(dto.ministrador),
      ministradora: paraLista(dto.ministradora),
    };
  }

  sacerdocioClasse(valor: string): string {
    if (valor === 'Não se aplica') return 'rx-campo-neutro';
    if (valor === 'Não ordenado') return 'rx-campo-negativo';
    return 'rx-campo-positivo';
  }

  recomendacaoEmitida(valor: string): boolean {
    return valor !== 'Não Emitida';
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }
}
