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

  // Filtro por recomendação ao templo na aba Detalhes (radio buttons) — "todos" é o estado
  // inicial (nenhuma filtragem), mesmo critério "ativa vs. resto" já usado no Resumo/Gráfico.
  filtroRecomendacao: 'todos' | 'ativa' | 'vencida' = 'todos';

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
        this.filtroRecomendacao = 'todos';
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

  mudarFiltroRecomendacao(valor: 'todos' | 'ativa' | 'vencida'): void {
    this.filtroRecomendacao = valor;
  }

  // Lista exibida na aba Detalhes — aplica o radio de recomendação sobre detalhesMembros.
  // "vencida" aqui é o mesmo complemento de "Ativa" usado em resumoMembros.inativos (Vencida,
  // Não Emitida, Cancelada, Vence este mês etc. — tudo que não é literalmente "Ativa").
  get detalhesFiltrados(): MembroDetalhe[] {
    if (this.filtroRecomendacao === 'ativa') {
      return this.detalhesMembros.filter(p => p.recomendacaoTemplo === 'Ativa');
    }
    if (this.filtroRecomendacao === 'vencida') {
      return this.detalhesMembros.filter(p => p.recomendacaoTemplo !== 'Ativa');
    }
    return this.detalhesMembros;
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
