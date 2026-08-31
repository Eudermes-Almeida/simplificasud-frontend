import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalhesConversosDTO, RaioxApiService } from '../../services/raiox-api.service';

interface ConversoDetalhe {
  nome: string;
  idade: number;
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
        // O backend omite a chave inteira (JSON-B) quando sacerdocio/recomendacao vêm nulos no
        // banco — normaliza para as strings de convenção já usadas no resto do dado (single
        // source of truth) antes de qualquer contagem/mapeamento, para nunca tratar "em branco"
        // como se fosse um valor real (ex: um sacerdocio ausente não pode contar como "ordenado").
        const dadosNormalizados = dados.map(dto => ({
          ...dto,
          sacerdocio: dto.sacerdocio || 'Não se aplica',
          recomendacao: dto.recomendacao || 'Não Emitida',
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
      ativo: dto.ativo === 'Sim',
      chamado: dto.tem_chamado === 'Sim',
      ministrador: this.temMinistracao(dto),
      recomendacao: dto.recomendacao,
      sacerdocio: dto.sacerdocio,
    };
  }

  // Tem ministração se houver um ministrador OU uma ministradora designados — homens só têm
  // ministrador ("ministradora" vem "null" na origem para eles, nunca uma designação real).
  private temMinistracao(dto: DetalhesConversosDTO): boolean {
    return dto.ministrador !== 'Sem Designação' || (dto.ministradora !== 'Sem Designação' && dto.ministradora !== 'null');
  }

  // "Sem Designação" (sem ministrador/ministradora) e "null" (campo Ministradora em
  // registros masculinos, literal na origem) viram lista vazia — nunca um nome de fato.
  private mapMinistracao(dto: DetalhesConversosDTO): ConversoMinistracao {
    const paraLista = (valor: string) => (valor === 'Sem Designação' || valor === 'null') ? [] : valor.split(',').map(nome => nome.trim());

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
