import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalhesConversosDTO, RaioxApiService } from '../../services/raiox-api.service';
import { AuthService } from '../../services/auth.service';

interface ConversoDetalhe {
  nome: string;
  idade: number;
  unidade: string;
  sexo: string;
  dataBatismo: string;
  batizadoUltimos30Dias: boolean;
  chamado: boolean;
  chamadoNome: string;
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

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo) — mesmo padrão de
// homens-avancando-sacerdocio.component.ts.
type FiltroDetalhe =
  | 'batismos30'
  | 'sexoMasculino'
  | 'ordenados'
  | 'recomendacao'
  | 'chamado'
  | 'ministradores'
  | null;

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
    batismosUltimos30Dias: { valor: 0 },
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

  // Filtro acionado pelo botão "Detalhes" de cada card do Resumo — a aba Detalhes usa isso
  // pra restringir a listagem em vez de sempre mostrar todo mundo.
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    batismos30: 'Batizados nos últimos 30 dias',
    sexoMasculino: 'Sexo masculino',
    ordenados: 'Ordenados ao sacerdócio',
    recomendacao: 'Com recomendação ao templo',
    chamado: 'Receberam um chamado',
    ministradores: 'Com ministradores',
  };

  constructor(private raioxApiService: RaioxApiService, private authService: AuthService) {}

  // Nível B vê o card "Com recomendação ao templo" normalmente - só o botão "Detalhes"
  // dele e o campo no detalhamento por pessoa não renderizam pra esse nível (decisão
  // revisada 2026-09-18). Ver memória project-raiox-matriz-acesso-ab-design.
  get isNivelB(): boolean {
    return this.authService.isNivelB();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;
    this.filtroAtivo = null;

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
    const pct = (contagem: number, base: number = total) => base > 0 ? Math.round((contagem / base) * 100) : 0;

    const batismosUltimos30Dias = dados.filter(d => this.hasBatismoNosUltimos30Dias(d.data_batismo)).length;
    const sexoMasculino = dados.filter(d => d.sexo === 'M' && Number(d.idade) >= 11).length;
    const ordenandosSacerdocio = dados.filter(d => d.sacerdocio !== 'Não Ordenado' && d.sacerdocio !== 'Não se aplica').length;
    const comRecomendacaoTemplos = dados.filter(d => this.recomendacaoEmitida(d.recomendacao)).length;
    const receberamChamado = dados.filter(d => this.temChamado(d.tem_chamado)).length;
    const comMinistradores = dados.filter(d => this.temMinistracao(d)).length;

    return {
      qtBatismos: { valor: total, pct: 100 },
      batismosUltimos30Dias: { valor: batismosUltimos30Dias },
      sexoMasculino: { valor: sexoMasculino, pct: pct(sexoMasculino) },
      ordenandosSacerdocio: { valor: ordenandosSacerdocio, pct: pct(ordenandosSacerdocio, sexoMasculino) },
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
      sexo: dto.sexo,
      dataBatismo: this.formatarDataBrasileira(dto.data_batismo),
      batizadoUltimos30Dias: this.hasBatismoNosUltimos30Dias(dto.data_batismo),
      chamado: this.temChamado(dto.tem_chamado),
      chamadoNome: dto.tem_chamado,
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

  // tem_chamado vem da API como "Sem chamado" ou o nome do próprio cargo (ex: "Secretário
  // do Quórum de Élderes") - nunca um booleano "Sim"/"Não".
  private temChamado(valor: string): boolean {
    return !!valor && valor !== 'Sem chamado';
  }

  // data_batismo em detalhesconversos vem da API em formato ISO (aaaa-mm-dd) - diferente de
  // homenspreparados, que vem em dd/mm/aaaa (planilhas/cargas distintas, ver
  // 016_carga_detalhesconversos_local.sql vs 019_carga_homenspreparados_local.sql). Parse manual
  // em vez de new Date(dataBatismo) direto porque esse construtor trata string ISO "aaaa-mm-dd"
  // como UTC meia-noite, podendo exibir o dia anterior dependendo do fuso horário local.
  private hasBatismoNosUltimos30Dias(dataBatismo: string): boolean {
    const data = this.parseDataIso(dataBatismo);
    if (!data) return false;

    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    return data >= limite && data <= hoje;
  }

  private parseDataIso(dataBatismo: string): Date | null {
    const [ano, mes, dia] = (dataBatismo || '').split('-').map(Number);
    if (!dia || !mes || !ano) return null;

    const data = new Date(ano, mes - 1, dia);
    return isNaN(data.getTime()) ? null : data;
  }

  // Exibição (aba Detalhes) em dd/mm/aaaa — o valor bruto ISO (aaaa-mm-dd) segue intocado no
  // resto do fluxo (hasBatismoNosUltimos30Dias compara contra ele), essa é só a transformação
  // de exibição.
  private formatarDataBrasileira(dataIso: string): string {
    const [ano, mes, dia] = (dataIso || '').split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataIso;
  }

  // Regra por sexo (não por convenção de placeholder): homens só contam pela coluna
  // "ministrador" (a "ministradora" nunca se aplica a eles, seja qual for o valor bruto vindo
  // da planilha); mulheres contam se houver designação em QUALQUER uma das duas colunas (OR).
  private temMinistracao(dto: DetalhesConversosDTO): boolean {
    if (dto.sexo === 'M') {
      return !this.semDesignacao(dto.ministrador);
    }
    return !this.semDesignacao(dto.ministrador) || !this.semDesignacao(dto.ministradora);
  }

  // "Sem designação" (nenhum ministrador/ministradora) e o placeholder do campo Ministradora em
  // registros masculinos viram lista vazia — nunca um nome de fato.
  //
  // Separador entre pessoas mudou de vírgula para ponto e vírgula na migração de 2026-09 (cada
  // nome já vem no formato "Sobrenome, Nome" — splitar por vírgula quebrava um nome no meio,
  // ex: "Anunciação, Cristiano ; Oliveira, Creciane" virava 3 fragmentos em vez de 2 pessoas).
  private mapMinistracao(dto: DetalhesConversosDTO): ConversoMinistracao {
    const paraLista = (valor: string) =>
      (this.semDesignacao(valor) || RecemConversosComponent.SEM_MINISTRADORA_HOMEM.includes(valor))
        ? []
        : valor.split(';').map(nome => nome.trim());

    return {
      nome: dto.nome,
      sexo: dto.sexo,
      ministrador: paraLista(dto.ministrador),
      ministradora: paraLista(dto.ministradora),
    };
  }

  sacerdocioClasse(valor: string): string {
    if (valor === 'Não se aplica') return 'rx-campo-neutro';
    if (valor === 'Não Ordenado') return 'rx-campo-negativo';
    return 'rx-campo-positivo';
  }

  // Considera "ativa" tanto o status "Ativa" quanto qualquer variação "Vence..."
  // (vence este mês/em dois meses/em três meses) - a recomendação continua valendo
  // até vencer. Qualquer outro valor (ex: "Recomendação Não Emitida") não conta.
  recomendacaoEmitida(valor: string): boolean {
    return valor === 'Ativa' || valor.toLowerCase().includes('vence');
  }

  // O dado bruto da não-emitida já vem como "Recomendação Não Emitida" (repete o rótulo do
  // card, que já diz "Recomendação") — mostra só "Não Emitida" nesse caso; os demais valores
  // (Ativa/Vence...) continuam exibidos como vieram.
  textoRecomendacao(valor: string): string {
    return this.recomendacaoEmitida(valor) ? valor : 'Não Emitida';
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }

  // Lista efetivamente exibida na aba Detalhes — aplica o filtro do card clicado no Resumo
  // (ou mostra todo mundo quando não há filtro ativo, inclusive vindo do card "Qt Batismos").
  get detalhesFiltrados(): ConversoDetalhe[] {
    switch (this.filtroAtivo) {
      case 'batismos30':
        return this.detalhesConversos.filter(p => p.batizadoUltimos30Dias);
      case 'sexoMasculino':
        return this.detalhesConversos.filter(p => p.sexo === 'M' && p.idade >= 11);
      case 'ordenados':
        return this.detalhesConversos.filter(p => p.sacerdocio !== 'Não Ordenado' && p.sacerdocio !== 'Não se aplica');
      case 'recomendacao':
        return this.detalhesConversos.filter(p => this.recomendacaoEmitida(p.recomendacao));
      case 'chamado':
        return this.detalhesConversos.filter(p => p.chamado);
      case 'ministradores':
        return this.detalhesConversos.filter(p => p.ministrador);
      default:
        return this.detalhesConversos;
    }
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? RecemConversosComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Detalhes" de cada card do Resumo — troca de aba e já aplica o filtro
  // correspondente. `null` (card "Qt Batismos") só troca de aba, sem filtrar.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }
}
