import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembrosAdultosSolteirosDTO, RaioxApiService } from '../../services/raiox-api.service';
import { AuthService } from '../../services/auth.service';

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
// homens-avancando-sacerdocio.component.ts/recem-conversos.component.ts. Um único filtro
// "achatado" (não duas camadas combinadas) — "ativaSemChamado" é uma opção própria, não um
// filtro por cima de "ativa", a pedido do usuário (4 pills no total, todas mutuamente
// exclusivas: Todos/Ativa/Vencida/Ativa e Sem chamado). "chamado" (card "Com chamados") não
// tem pill própria, só é alcançável pelo botão do card — mesmo caso já usado nos outros
// componentes para o card "Total".
type FiltroDetalhe = 'ativa' | 'vencida' | 'chamado' | 'ativaSemChamado' | null;

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
    ativaSemChamado: 'Recomendação Ativa e Sem chamado',
  };

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

  constructor(private raioxApiService: RaioxApiService, private authService: AuthService) {}

  // Nível B vê os cards de KPI e o gráfico normalmente - só não pode "detalhar" (botão
  // "Detalhes" dos cards, pills de filtro por status e campo no detalhamento não
  // renderizam). Ver mesmo comentário em missionarios-retornados.component.ts e memória
  // project-raiox-matriz-acesso-ab-design.
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

    this.raioxApiService.buscaMembrosAdultosSolteiros(this.unidade).subscribe({
      next: (dados) => {
        this.resumoMembros = this.calcularResumo(dados);
        this.detalhesMembros = dados.map(dto => this.mapDetalhe(dto));
        // Troca de unidade não deve carregar um filtro escolhido antes — sempre volta pra "todos".
        this.filtroAtivo = null;
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

  // Lista efetivamente exibida na aba Detalhes — aplica o filtro ativo (pills ou card do
  // Resumo), ou mostra todo mundo quando não há filtro (null). "vencida" é o mesmo complemento
  // de "Ativa" usado em resumoMembros.inativos (Vencida, Não Emitida, Cancelada, Vence este mês
  // etc. — tudo que não é literalmente "Ativa").
  get detalhesFiltrados(): MembroDetalhe[] {
    switch (this.filtroAtivo) {
      case 'ativa':
        return this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa');
      case 'vencida':
        return this.detalhesMembros.filter(p => p.recomendacaoTemplo !== 'Ativa');
      case 'chamado':
        return this.detalhesMembros.filter(p => p.chamados.length > 0);
      case 'ativaSemChamado':
        return this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa' && p.chamados.length === 0);
      default:
        return this.detalhesMembros;
    }
  }

  // Totalizador exibido dentro de cada uma das 4 pills fixas da aba Detalhes — sempre contado
  // sobre a lista bruta (não é uma camada por cima de outro filtro, é uma opção própria de
  // mesmo nível que as demais).
  get contagemFiltro(): Record<'todos' | 'ativa' | 'vencida' | 'ativaSemChamado', number> {
    return {
      todos: this.detalhesMembros.length,
      ativa: this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa').length,
      vencida: this.detalhesMembros.filter(p => p.recomendacaoTemplo !== 'Ativa').length,
      ativaSemChamado: this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa' && p.chamados.length === 0).length,
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
