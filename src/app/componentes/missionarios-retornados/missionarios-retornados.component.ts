import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionariosRetornadosDTO, RaioxApiService } from '../../services/raiox-api.service';
import { AuthService } from '../../services/auth.service';

interface MissionarioDetalhe {
  nome: string;
  idade: string;
  unidade: string;
  recomendacaoTemplo: string;
  selado: boolean;
  estadoCivil: string;
  paisMissao: string;
  chamados: string[];
}

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo) — mesmo padrão de
// homens-avancando-sacerdocio.component.ts/recem-conversos.component.ts.
type FiltroDetalhe = 'inativos' | 'ativos' | 'selados' | 'chamado' | 'solteiros' | null;

// Filtro adicional (radio-pill com totalizador) na aba Detalhes — mesma técnica do filtro
// Berçário em jovens-criancas.component.ts, aqui combinado por cima do filtro dos cards
// (FiltroDetalhe acima), não em substituição a ele.
type FiltroExtra = 'todos' | 'ativoSemChamado';

@Component({
  selector: 'app-missionarios-retornados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './missionarios-retornados.component.html',
  styleUrl: './missionarios-retornados.component.css'
})
export class MissionariosRetornadosComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — todos derivados da lista bruta vinda da API,
  // recalculados a cada busca (ver buscarDados/calcularResumo).
  resumoMissionarios = {
    total: { valor: 0, pct: 100 },
    selados: { valor: 0, pct: 0 },
    recomendacaoAtiva: { valor: 0, pct: 0 },
    inativos: { valor: 0, pct: 0 },
    matriculadosInstituto: { valor: 0, pct: 0 },
    comChamado: { valor: 0, pct: 0 },
    solteiros: { valor: 0, pct: 0 },
  };

  // Lista de missionários (fonte única usada pelos cards da aba Detalhes)
  detalhesMissionarios: MissionarioDetalhe[] = [];

  // Filtro acionado pelo botão "Detalhes" de cada card do Resumo — a aba Detalhes usa isso
  // pra restringir a listagem em vez de sempre mostrar todo mundo.
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    inativos: 'Inativos',
    ativos: 'Ativos',
    selados: 'Selados no templo',
    chamado: 'Com chamados',
    solteiros: 'Solteiros',
  };

  // Filtro adicional na aba Detalhes (radio-pill Todos/Ativos e Sem Chamado) — reseta junto
  // com filtroAtivo a cada troca de unidade.
  filtroExtra: FiltroExtra = 'todos';

  // Bandeira (código ISO 3166-1 alpha-2, usado pela lib flag-icons) por país de missão — só
  // as 10 opções confirmadas pelo usuário. Um país fora dessa lista não deve exibir nenhum
  // ícone no lugar (ver bandeira()), não um genérico.
  // Nota: emoji de bandeira (🇧🇷 etc.) foi tentado primeiro, mas Windows/Chrome não tem a
  // fonte de emoji colorido necessária e renderiza só o código do país como texto ("BR") —
  // por isso o ícone real vem de flag-icons (SVG via CSS), não de texto/emoji.
  private static readonly BANDEIRAS: Record<string, string> = {
    'Brasil': 'br',
    'Venezuela': 've',
    'Argentina': 'ar',
    'Chile': 'cl',
    'Cabo Verde': 'cv',
    'Estados Unidos': 'us',
    'Japão': 'jp',
    'México': 'mx',
    'Moçambique': 'mz',
    'Portugal': 'pt',
  };

  constructor(private raioxApiService: RaioxApiService, private authService: AuthService) {}

  // Nível B (Conselho/Sumo Conselho) vê os cards de KPI e o gráfico normalmente - só não
  // pode "detalhar" essa informação: o botão "Detalhes" dos cards Inativos/Ativos, o campo
  // no detalhamento por pessoa e o filtro "Ativos e Sem Chamado" não renderizam pra esse
  // nível (decisão revisada 2026-09-18 após validação com os líderes: aba Resumo precisa
  // mostrar todos os cards). O backend manda o dado pra todo mundo agora - essa é só a
  // camada de UI que impede "detalhar". Ver memória project-raiox-matriz-acesso-ab-design.
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
    this.filtroExtra = 'todos';

    this.raioxApiService.buscaMissionariosRetornados(this.unidade).subscribe({
      next: (dados) => {
        this.resumoMissionarios = this.calcularResumo(dados);
        this.detalhesMissionarios = dados.map(dto => this.mapDetalhe(dto));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de missionários retornados.';
        this.carregando = false;
        console.error('Erro ao buscar missionários retornados:', err);
      },
    });
  }

  private calcularResumo(dados: MissionariosRetornadosDTO[]): typeof this.resumoMissionarios {
    const total = dados.length;
    const pct = (contagem: number) => total > 0 ? Math.round((contagem / total) * 100) : 0;

    const selados = dados.filter(d => d.selado === 'Sim').length;
    const recomendacaoAtiva = dados.filter(d => d.recomendacaotemplo === 'Ativa').length;
    // "Inativo" aqui é definido como o complemento de recomendação ativa (total - recomendação
    // ativa), não uma coluna própria da planilha — regra dada pelo usuário.
    const inativos = total - recomendacaoAtiva;
    const matriculadosInstituto = dados.filter(d => d.matriculadoinstituto === 'Sim').length;
    const comChamado = dados.filter(d => !!d.chamado && d.chamado.trim() !== '').length;
    const solteiros = dados.filter(d => d.solteiro === 'Sim').length;

    return {
      total: { valor: total, pct: 100 },
      selados: { valor: selados, pct: pct(selados) },
      recomendacaoAtiva: { valor: recomendacaoAtiva, pct: pct(recomendacaoAtiva) },
      inativos: { valor: inativos, pct: pct(inativos) },
      matriculadosInstituto: { valor: matriculadosInstituto, pct: pct(matriculadosInstituto) },
      comChamado: { valor: comChamado, pct: pct(comChamado) },
      solteiros: { valor: solteiros, pct: pct(solteiros) },
    };
  }

  private mapDetalhe(dto: MissionariosRetornadosDTO): MissionarioDetalhe {
    return {
      nome: dto.nome,
      idade: dto.idade,
      unidade: dto.unidade,
      recomendacaoTemplo: dto.recomendacaotemplo,
      selado: dto.selado === 'Sim',
      estadoCivil: dto.solteiro === 'Sim' ? 'Solteiro' : 'Casado',
      paisMissao: dto.paismissao,
      // Vários chamados vêm concatenados numa única célula, separados por vírgula
      // (ver 007_create_table_missionariosretornados.sql) — cada um vira sua própria tag.
      chamados: dto.chamado ? dto.chamado.split(',').map(c => c.trim()).filter(c => c !== '') : [],
    };
  }

  recomendacaoClasse(valor: string): string {
    if (valor === 'Ativa') return 'rx-campo-positivo';
    if (valor === 'Vence este mês') return 'rx-campo-neutro';
    return 'rx-campo-negativo';
  }

  // Só as 10 bandeiras confirmadas — qualquer outro país retorna string vazia, propositalmente,
  // para não renderizar nenhum ícone (ver BANDEIRAS acima).
  bandeiraCodigo(pais: string): string {
    return MissionariosRetornadosComponent.BANDEIRAS[pais] ?? '';
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }

  // Gráfico de pizza 3D (CSS puro, ver .html/.css) — Ativos (recomendação ativa) x Inativos.
  // O corte em graus vem direto das contagens brutas (não dos dois percentuais já arredondados
  // de resumoMissionarios), pra nunca deixar um gap/sobreposição de 1° na borda entre as cores
  // por causa de arredondamento independente (ex.: 42%+58% já bate 100%, mas nem sempre bate).
  get pizzaGradiente(): string {
    const total = this.resumoMissionarios.total.valor;
    if (total === 0) {
      return '#e2e8f0';
    }
    const corteGraus = (this.resumoMissionarios.recomendacaoAtiva.valor / total) * 360;
    return `conic-gradient(#16a34a 0deg ${corteGraus}deg, #dc2626 ${corteGraus}deg 360deg)`;
  }

  // Resultado do filtro dos cards do Resumo (FiltroDetalhe), antes do filtro adicional
  // (FiltroExtra) — separado em getter próprio pra poder ser reaproveitado tanto pela lista
  // final quanto pelo totalizador do filtro adicional.
  private get detalhesPosFiltroCard(): MissionarioDetalhe[] {
    switch (this.filtroAtivo) {
      case 'inativos':
        return this.detalhesMissionarios.filter(p => p.recomendacaoTemplo !== 'Ativa');
      case 'ativos':
        return this.detalhesMissionarios.filter(p => p.recomendacaoTemplo === 'Ativa');
      case 'selados':
        return this.detalhesMissionarios.filter(p => p.selado);
      case 'chamado':
        return this.detalhesMissionarios.filter(p => p.chamados.length > 0);
      case 'solteiros':
        return this.detalhesMissionarios.filter(p => p.estadoCivil === 'Solteiro');
      default:
        return this.detalhesMissionarios;
    }
  }

  private aplicarFiltroExtra(lista: MissionarioDetalhe[], filtro: FiltroExtra): MissionarioDetalhe[] {
    if (filtro === 'ativoSemChamado') {
      return lista.filter(p => p.recomendacaoTemplo === 'Ativa' && p.chamados.length === 0);
    }
    return lista;
  }

  mudarFiltroExtra(valor: FiltroExtra): void {
    this.filtroExtra = valor;
  }

  // Lista efetivamente exibida na aba Detalhes — combina o filtro do card clicado no Resumo
  // (ou mostra todo mundo quando não há filtro ativo, inclusive vindo do card "Total") com o
  // filtro adicional (Todos/Ativos e Sem Chamado) aplicado por cima.
  get detalhesFiltrados(): MissionarioDetalhe[] {
    return this.aplicarFiltroExtra(this.detalhesPosFiltroCard, this.filtroExtra);
  }

  // Totalizador exibido dentro de cada pill do filtro adicional — contado sobre o resultado
  // do filtro dos cards (não sobre a lista bruta), pra continuar coerente com o que já está
  // sendo mostrado quando os dois filtros são combinados.
  get contagemFiltroExtra(): Record<FiltroExtra, number> {
    const base = this.detalhesPosFiltroCard;
    return {
      todos: base.length,
      ativoSemChamado: this.aplicarFiltroExtra(base, 'ativoSemChamado').length,
    };
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? MissionariosRetornadosComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Detalhes" de cada card do Resumo — troca de aba e já aplica o filtro
  // correspondente. `null` (card "Total") só troca de aba, sem filtrar.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }
}
