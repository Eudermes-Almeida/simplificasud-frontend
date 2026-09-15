import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembrosAdultosSolteirosDTO, RaioxApiService } from '../../services/raiox-api.service';

interface MembroDetalhe {
  nome: string;
  idade: string;
  unidade: string;
  recomendacaoTemplo: string;
  sexo: string;
  paisMissao: string;
  chamados: string[];
}

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo) — mesmo padrão de
// homens-avancando-sacerdocio.component.ts/recem-conversos.component.ts. Substitui o antigo
// "filtroRecomendacao" (que só cobria ativa/vencida) porque agora "Com chamados" também
// precisa entrar como filtro, e as 3 pills existentes (Todos/Ativa/Vencida) passam a refletir
// este mesmo estado unificado em vez de um próprio.
type FiltroDetalhe = 'ativa' | 'vencida' | 'chamado' | null;

// Filtro adicional (radio-pill com totalizador) na aba Detalhes — mesma técnica do filtro
// Berçário em jovens-criancas.component.ts / "Ativos e Sem Chamado" em
// missionarios-retornados.component.ts, combinado por cima do FiltroDetalhe acima.
type FiltroExtra = 'todos' | 'ativaSemChamado';

@Component({
  selector: 'app-membros-adultos-solteiros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membros-adultos-solteiros.component.html',
  styleUrl: './membros-adultos-solteiros.component.css'
})
export class MembrosAdultosSolteirosComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — todos derivados da lista bruta vinda da API,
  // recalculados a cada busca (ver buscarDados/calcularResumo). Ao contrário de
  // missionariosretornados, esta tabela não tem "selado"/"matriculadoinstituto" (não existem
  // como colunas na planilha "Membros Adultos Solteiros") — sexo entra no lugar, já que é uma
  // coluna real e relevante para planejamento de atividades desse público.
  resumoMembros = {
    total: { valor: 0, pct: 100 },
    ativos: { valor: 0, pct: 0 },
    inativos: { valor: 0, pct: 0 },
    comChamado: { valor: 0, pct: 0 },
    homens: { valor: 0, pct: 0 },
    mulheres: { valor: 0, pct: 0 },
  };

  // Lista de membros (fonte única usada pelos cards da aba Detalhes)
  detalhesMembros: MembroDetalhe[] = [];

  // Filtro acionado tanto pelas 3 pills fixas da aba Detalhes quanto pelo botão "Detalhes" dos
  // cards do Resumo (Recomendação Vencida/Recomendação Ativa/Com chamados) — null é "Todos".
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    ativa: 'Recomendação Ativa',
    vencida: 'Recomendação Vencida ou não emitida',
    chamado: 'Com chamados',
  };

  // Filtro adicional na aba Detalhes (radio-pill Todos/Recomendação ativa e Sem chamado) —
  // reseta junto com filtroAtivo a cada troca de unidade.
  filtroExtra: FiltroExtra = 'todos';

  // Bandeira (código ISO 3166-1 alpha-2, usado pela lib flag-icons) por país de missão — mesmo
  // mapa de missionarios-retornados.component.ts, com "Reino Unido" (gb) acrescentado porque
  // aparece nesta planilha e não na de missionários retornados. Um país fora dessa lista não
  // deve exibir nenhum ícone no lugar (ver bandeira()), não um genérico. A maioria das pessoas
  // aqui tem paismissao = "Não serviu Missão" (não é um país) — cai nesse mesmo "sem ícone".
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
    'Reino Unido': 'gb',
  };

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    this.raioxApiService.buscaMembrosAdultosSolteiros(this.unidade).subscribe({
      next: (dados) => {
        this.resumoMembros = this.calcularResumo(dados);
        this.detalhesMembros = dados.map(dto => this.mapDetalhe(dto));
        // Troca de unidade não deve carregar um filtro escolhido antes — sempre volta pra "todos".
        this.filtroAtivo = null;
        this.filtroExtra = 'todos';
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de membros adultos solteiros.';
        this.carregando = false;
        console.error('Erro ao buscar membros adultos solteiros:', err);
      },
    });
  }

  private calcularResumo(dados: MembrosAdultosSolteirosDTO[]): typeof this.resumoMembros {
    const total = dados.length;
    const pct = (contagem: number) => total > 0 ? Math.round((contagem / total) * 100) : 0;

    const ativos = dados.filter(d => d.recomendacaotemplo === 'Ativa').length;
    // "Inativo" aqui é definido como o complemento de recomendação ativa (total - recomendação
    // ativa), não uma coluna própria da planilha — mesma regra usada em missionarios-retornados.
    const inativos = total - ativos;
    // "Não tem chamado" é o valor literal da planilha para quem não possui chamado (não é
    // null/vazio) — precisa ser tratado à parte, não conta como "com chamado".
    const comChamado = dados.filter(d => !!d.chamados && d.chamados.trim() !== '' && d.chamados.trim() !== 'Não tem chamado').length;
    const homens = dados.filter(d => d.sexo === 'M').length;
    const mulheres = dados.filter(d => d.sexo === 'F').length;

    return {
      total: { valor: total, pct: 100 },
      ativos: { valor: ativos, pct: pct(ativos) },
      inativos: { valor: inativos, pct: pct(inativos) },
      comChamado: { valor: comChamado, pct: pct(comChamado) },
      homens: { valor: homens, pct: pct(homens) },
      mulheres: { valor: mulheres, pct: pct(mulheres) },
    };
  }

  private mapDetalhe(dto: MembrosAdultosSolteirosDTO): MembroDetalhe {
    const chamadosTratado = dto.chamados?.trim();
    return {
      nome: dto.nome,
      idade: dto.idade,
      unidade: dto.unidade,
      recomendacaoTemplo: dto.recomendacaotemplo,
      sexo: dto.sexo,
      paisMissao: dto.paismissao,
      // "Não tem chamado" (valor literal da planilha) vira lista vazia, mesmo tratamento de
      // uma célula em branco — cai no tag neutro "Nenhum" (ver template).
      chamados: (!chamadosTratado || chamadosTratado === 'Não tem chamado')
        ? []
        : chamadosTratado.split(',').map(c => c.trim()).filter(c => c !== ''),
    };
  }

  recomendacaoClasse(valor: string): string {
    if (valor === 'Ativa') return 'rx-campo-positivo';
    if (valor === 'Vence este mês') return 'rx-campo-neutro';
    return 'rx-campo-negativo';
  }

  // Só as 11 bandeiras confirmadas — qualquer outro país (incluindo "Não serviu Missão", que
  // não é um país) retorna string vazia, propositalmente, para não renderizar nenhum ícone.
  bandeiraCodigo(pais: string): string {
    return MembrosAdultosSolteirosComponent.BANDEIRAS[pais] ?? '';
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }

  // Usado tanto pelas 3 pills fixas da aba Detalhes (fica na mesma aba) quanto internamente
  // por detalharCard (troca de aba) — ambos só precisam trocar o estado do filtro.
  mudarFiltroAtivo(valor: FiltroDetalhe): void {
    this.filtroAtivo = valor;
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? MembrosAdultosSolteirosComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Detalhes" dos cards do Resumo — troca de aba e já aplica o filtro
  // correspondente.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }

  // Resultado do filtro ativo (pills fixas ou cards do Resumo), antes do filtro adicional
  // (FiltroExtra) — separado em getter próprio pra ser reaproveitado tanto pela lista final
  // quanto pelo totalizador do filtro adicional. "vencida" é o mesmo complemento de "Ativa"
  // usado em resumoMembros.inativos (Vencida, Não Emitida, Cancelada, Vence este mês etc. —
  // tudo que não é literalmente "Ativa").
  private get detalhesPosFiltroAtivo(): MembroDetalhe[] {
    switch (this.filtroAtivo) {
      case 'ativa':
        return this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa');
      case 'vencida':
        return this.detalhesMembros.filter(p => p.recomendacaoTemplo !== 'Ativa');
      case 'chamado':
        return this.detalhesMembros.filter(p => p.chamados.length > 0);
      default:
        return this.detalhesMembros;
    }
  }

  private aplicarFiltroExtra(lista: MembroDetalhe[], filtro: FiltroExtra): MembroDetalhe[] {
    if (filtro === 'ativaSemChamado') {
      return lista.filter(p => p.recomendacaoTemplo === 'Ativa' && p.chamados.length === 0);
    }
    return lista;
  }

  mudarFiltroExtra(valor: FiltroExtra): void {
    this.filtroExtra = valor;
  }

  // Lista efetivamente exibida na aba Detalhes — combina o filtro ativo (pills fixas ou card do
  // Resumo) com o filtro adicional (Todos/Recomendação ativa e Sem chamado) aplicado por cima.
  get detalhesFiltrados(): MembroDetalhe[] {
    return this.aplicarFiltroExtra(this.detalhesPosFiltroAtivo, this.filtroExtra);
  }

  // Totalizador exibido dentro de cada pill do filtro adicional — contado sobre o resultado do
  // filtro ativo (não sobre a lista bruta), pra continuar coerente quando os dois são combinados.
  get contagemFiltroExtra(): Record<FiltroExtra, number> {
    const base = this.detalhesPosFiltroAtivo;
    return {
      todos: base.length,
      ativaSemChamado: this.aplicarFiltroExtra(base, 'ativaSemChamado').length,
    };
  }

  // Gráfico de pizza 3D (CSS puro, ver .html/.css) — Ativos (recomendação ativa) x Inativos.
  // O corte em graus vem direto das contagens brutas (não dos dois percentuais já arredondados
  // de resumoMembros), pra nunca deixar um gap/sobreposição de 1° na borda entre as cores por
  // causa de arredondamento independente.
  get pizzaGradiente(): string {
    const total = this.resumoMembros.total.valor;
    if (total === 0) {
      return '#e2e8f0';
    }
    const corteGraus = (this.resumoMembros.ativos.valor / total) * 360;
    return `conic-gradient(#16a34a 0deg ${corteGraus}deg, #dc2626 ${corteGraus}deg 360deg)`;
  }
}
