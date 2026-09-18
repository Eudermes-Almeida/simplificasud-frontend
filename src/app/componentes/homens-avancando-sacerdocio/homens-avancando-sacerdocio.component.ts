import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomensPreparadosDTO, RaioxApiService } from '../../services/raiox-api.service';
import { AuthService } from '../../services/auth.service';

// Forma de HomensPreparadosDTO depois de buscarDados normalizar os campos opcionais
// (recomendacao ausente vira 'Não Emitida' etc) — mesmo padrão de
// recem-conversos.component.ts.
type HomensPreparadosNormalizado = HomensPreparadosDTO & {
  sacerdocio: string;
  recomendacao: string;
  ministrador: string;
};

interface HomemDetalhe {
  nome: string;
  idade: number;
  unidade: string;
  dataBatismo: string;
  batizadoUltimos30Dias: boolean;
  chamado: boolean;
  chamadoNome: string;
  ministrador: boolean;
  recomendacao: string;
  sacerdocio: string;
}

// Aba Ministradores — mesmo padrão de recem-conversos.component.ts, mas só com o bloco
// Ministrador (aqui não existe "sexo"/Ministradora, 100% dos registros já são homens).
interface HomemMinistracao {
  nome: string;
  ministrador: string[];
}

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo).
type FiltroDetalhe =
  | 'batismos30'
  | 'ordenados'
  | 'recomendacao'
  | 'chamado'
  | 'ministradores'
  | null;

@Component({
  selector: 'app-homens-avancando-sacerdocio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homens-avancando-sacerdocio.component.html',
  styleUrl: './homens-avancando-sacerdocio.component.css'
})
export class HomensAvancandoSacerdocioComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — mesmo padrão de recem-conversos, sem o card
  // de Sexo Masculino (aqui 100% dos registros já são homens, a tabela não traz "sexo").
  resumoHomens = {
    qtBatismos: { valor: 0, pct: 100 },
    batismosUltimos30Dias: { valor: 0 },
    ordenandosSacerdocio: { valor: 0, pct: 0 },
    comRecomendacaoTemplos: { valor: 0, pct: 0 },
    receberamChamado: { valor: 0, pct: 0 },
    comMinistradores: { valor: 0, pct: 0 }
  };

  // Lista de homens sendo preparados (fonte única usada pelos cards da aba Detalhes)
  detalhesHomens: HomemDetalhe[] = [];

  // Ministradores designados por homem (fonte única usada pelos cards da aba Ministradores)
  ministradoresHomens: HomemMinistracao[] = [];

  // Filtro acionado pelo botão "Click para Detalhar" de cada card do Resumo — a aba
  // Detalhes usa isso pra restringir a listagem em vez de sempre mostrar todo mundo.
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    batismos30: 'Batizados nos últimos 30 dias',
    ordenados: 'Ordenados ao sacerdócio',
    recomendacao: 'Com recomendação ao templo',
    chamado: 'Receberam um chamado',
    ministradores: 'Com ministradores',
  };

  constructor(private raioxApiService: RaioxApiService, private authService: AuthService) {}

  // Nível B não vê status de recomendação ao templo - mesmo motivo de
  // recem-conversos.component.ts. Ver memória project-raiox-matriz-acesso-ab-design.
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

    this.raioxApiService.buscaHomensPreparados(this.unidade).subscribe({
      next: (dados) => {
        // Mesmo cuidado de recem-conversos: o backend omite a chave (JSON-B) quando
        // sacerdocio/recomendacao/ministrador vêm nulos no banco — normaliza antes de
        // qualquer contagem/mapeamento pra nunca tratar "em branco" como valor real.
        const dadosNormalizados = dados.map(dto => ({
          ...dto,
          sacerdocio: dto.sacerdocio || 'Não Ordenado',
          recomendacao: dto.recomendacao || 'Não Emitida',
          ministrador: dto.ministrador || 'Não designado',
        }));

        this.resumoHomens = this.calcularResumo(dadosNormalizados);
        this.detalhesHomens = dadosNormalizados.map(dto => this.mapDetalhe(dto));
        this.ministradoresHomens = dadosNormalizados.map(dto => this.mapMinistracao(dto));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de homens avançando ao sacerdócio.';
        this.carregando = false;
        console.error('Erro ao buscar homens preparados:', err);
      },
    });
  }

  private calcularResumo(dados: HomensPreparadosNormalizado[]): typeof this.resumoHomens {
    const total = dados.length;
    const pct = (contagem: number, base: number = total) => base > 0 ? Math.round((contagem / base) * 100) : 0;

    const batismosUltimos30Dias = dados.filter(d => this.hasBatismoNosUltimos30Dias(d.data_batismo)).length;
    const ordenandosSacerdocio = dados.filter(d => d.sacerdocio !== 'Não Ordenado').length;
    const comRecomendacaoTemplos = dados.filter(d => this.recomendacaoEmitida(d.recomendacao)).length;
    const receberamChamado = dados.filter(d => this.temChamado(d.tem_chamado)).length;
    const comMinistradores = dados.filter(d => !this.semDesignacao(d.ministrador)).length;

    return {
      qtBatismos: { valor: total, pct: 100 },
      batismosUltimos30Dias: { valor: batismosUltimos30Dias },
      ordenandosSacerdocio: { valor: ordenandosSacerdocio, pct: pct(ordenandosSacerdocio) },
      comRecomendacaoTemplos: { valor: comRecomendacaoTemplos, pct: pct(comRecomendacaoTemplos) },
      receberamChamado: { valor: receberamChamado, pct: pct(receberamChamado) },
      comMinistradores: { valor: comMinistradores, pct: pct(comMinistradores) },
    };
  }

  private mapDetalhe(dto: HomensPreparadosNormalizado): HomemDetalhe {
    return {
      nome: dto.nome,
      idade: Number(dto.idade),
      unidade: dto.unidade,
      dataBatismo: dto.data_batismo,
      batizadoUltimos30Dias: this.hasBatismoNosUltimos30Dias(dto.data_batismo),
      chamado: this.temChamado(dto.tem_chamado),
      chamadoNome: dto.tem_chamado,
      ministrador: !this.semDesignacao(dto.ministrador),
      recomendacao: dto.recomendacao,
      sacerdocio: dto.sacerdocio,
    };
  }

  // Nomes separados por ";" (mesma convenção de 2026-09 usada em detalhesconversos) — cada
  // nome já vem no formato "Sobrenome, Nome", por isso não pode splitar por vírgula.
  private mapMinistracao(dto: HomensPreparadosDTO): HomemMinistracao {
    const paraLista = (valor: string) =>
      this.semDesignacao(valor) ? [] : valor.split(';').map(nome => nome.trim());

    return {
      nome: dto.nome,
      ministrador: paraLista(dto.ministrador),
    };
  }

  // Valores de "sem designação" já usados na origem em momentos diferentes (mesma planilha
  // de detalhesconversos) — ver recem-conversos.component.ts pela mesma convenção.
  private static readonly SEM_DESIGNACAO = ['Sem Designação', 'Não designado'];

  private semDesignacao(valor: string): boolean {
    return HomensAvancandoSacerdocioComponent.SEM_DESIGNACAO.includes(valor);
  }

  // tem_chamado vem da API como "Sem chamado" ou o nome do próprio cargo (ex: "Secretário
  // do Quórum de Élderes") - nunca um booleano "Sim"/"Não".
  private temChamado(valor: string): boolean {
    return !!valor && valor !== 'Sem chamado';
  }

  // data_batismo vem da API em formato brasileiro (dd/mm/aaaa, direto da planilha) - new Date()
  // nativo interpreta string com "/" como mm/dd/aaaa americano e erra a conta, por isso o
  // parse manual abaixo.
  private hasBatismoNosUltimos30Dias(dataBatismo: string): boolean {
    const data = this.parseDataBrasileira(dataBatismo);
    if (!data) return false;

    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    return data >= limite && data <= hoje;
  }

  private parseDataBrasileira(dataBatismo: string): Date | null {
    const [dia, mes, ano] = (dataBatismo || '').split('/').map(Number);
    if (!dia || !mes || !ano) return null;

    const data = new Date(ano, mes - 1, dia);
    return isNaN(data.getTime()) ? null : data;
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
  get detalhesFiltrados(): HomemDetalhe[] {
    switch (this.filtroAtivo) {
      case 'batismos30':
        return this.detalhesHomens.filter(p => p.batizadoUltimos30Dias);
      case 'ordenados':
        return this.detalhesHomens.filter(p => p.sacerdocio !== 'Não Ordenado');
      case 'recomendacao':
        return this.detalhesHomens.filter(p => this.recomendacaoEmitida(p.recomendacao));
      case 'chamado':
        return this.detalhesHomens.filter(p => p.chamado);
      case 'ministradores':
        return this.detalhesHomens.filter(p => p.ministrador);
      default:
        return this.detalhesHomens;
    }
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? HomensAvancandoSacerdocioComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Click para Detalhar" de cada card do Resumo — troca de aba e já
  // aplica o filtro correspondente. `null` (card "Qt Batismos") só troca de aba, sem filtrar.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }
}
