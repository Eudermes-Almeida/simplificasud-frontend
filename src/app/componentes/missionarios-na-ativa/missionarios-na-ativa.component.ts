import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DadosMissionariosDTO, RaioxApiService } from '../../services/raiox-api.service';

interface MissionarioDetalhe {
  nome: string;
  nomeMissao: string;
  idade: string;
  status: string;
  unidade: string;
  iniciomissao: string;
  finalmissao: string;
  missao: string;
  aniversario: string;
  foto: string;
  fotoQuebrada: boolean;
}

// Chave de cada card de KPI do Resumo que também funciona como filtro da aba Detalhes
// (null = sem filtro, mostra todo mundo) — mesmo padrão de
// homens-avancando-sacerdocio.component.ts/recem-conversos.component.ts.
type FiltroDetalhe = 'noCampo' | 'sedeIgreja' | 'preenchendo' | null;

@Component({
  selector: 'app-missionarios-na-ativa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './missionarios-na-ativa.component.html',
  styleUrl: './missionarios-na-ativa.component.css'
})
export class MissionariosNaAtivaComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — todos derivados da lista bruta vinda da API,
  // recalculados a cada busca (ver buscarDados/calcularResumo). Quebra por "status"
  // (No Campo / Sede da Igreja / Preenchendo), confirmada com o usuário via AskUserQuestion.
  resumoMissionarios = {
    total: { valor: 0, pct: 100 },
    noCampo: { valor: 0, pct: 0 },
    sedeIgreja: { valor: 0, pct: 0 },
    preenchendo: { valor: 0, pct: 0 },
    homens: { valor: 0, pct: 0 },
    mulheres: { valor: 0, pct: 0 },
  };

  // Lista de missionários (fonte única usada pelos cards da aba Detalhes)
  detalhesMissionarios: MissionarioDetalhe[] = [];

  // Filtro acionado pelo botão "Detalhes" de cada card do Resumo — a aba Detalhes usa isso
  // pra restringir a listagem em vez de sempre mostrar todo mundo.
  filtroAtivo: FiltroDetalhe = null;

  private static readonly LABEL_FILTRO: Record<Exclude<FiltroDetalhe, null>, string> = {
    noCampo: 'No Campo',
    sedeIgreja: 'Sede da Igreja',
    preenchendo: 'Preenchendo',
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
    this.filtroAtivo = null;

    this.raioxApiService.buscaDadosMissionarios(this.unidade).subscribe({
      next: (dados) => {
        this.resumoMissionarios = this.calcularResumo(dados);
        this.detalhesMissionarios = dados.map(dto => this.mapDetalhe(dto));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de missionários na ativa.';
        this.carregando = false;
        console.error('Erro ao buscar missionários na ativa:', err);
      },
    });
  }

  private calcularResumo(dados: DadosMissionariosDTO[]): typeof this.resumoMissionarios {
    const total = dados.length;
    const pct = (contagem: number) => total > 0 ? Math.round((contagem / total) * 100) : 0;

    const noCampo = dados.filter(d => d.status === 'No Campo').length;
    const sedeIgreja = dados.filter(d => d.status === 'Sede da Igreja').length;
    const preenchendo = dados.filter(d => d.status === 'Preenchendo').length;
    const homens = dados.filter(d => d.sexo === 'M').length;
    const mulheres = dados.filter(d => d.sexo === 'F').length;

    return {
      total: { valor: total, pct: 100 },
      noCampo: { valor: noCampo, pct: pct(noCampo) },
      sedeIgreja: { valor: sedeIgreja, pct: pct(sedeIgreja) },
      preenchendo: { valor: preenchendo, pct: pct(preenchendo) },
      homens: { valor: homens, pct: pct(homens) },
      mulheres: { valor: mulheres, pct: pct(mulheres) },
    };
  }

  private mapDetalhe(dto: DadosMissionariosDTO): MissionarioDetalhe {
    return {
      nome: dto.nomecompleto,
      nomeMissao: dto.nomemissao,
      idade: dto.idade,
      status: dto.status,
      unidade: dto.unidade,
      iniciomissao: dto.iniciomissao,
      finalmissao: dto.finalmissao,
      missao: dto.missao,
      aniversario: this.formatarAniversario(dto.aniversario),
      foto: dto.linkfoto,
      fotoQuebrada: false,
    };
  }

  private static readonly MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];

  // A coluna "aniversario" guarda "dd/mm/aaaa" (ver 012_carga_dadosmissionarios.sql — convertida
  // do serial de data do Excel nesse formato pra ficar igual iniciomissao/finalmissao), mas o
  // card exibe só "dia de mês" — o ano de nascimento não é o que se quer destacar num
  // aniversário. Se o formato vier diferente do esperado, mostra o valor original sem quebrar.
  private formatarAniversario(data: string): string {
    const partes = data?.split('/') ?? [];
    if (partes.length !== 3) {
      return data;
    }
    const dia = partes[0];
    const mes = MissionariosNaAtivaComponent.MESES[parseInt(partes[1], 10) - 1];
    return mes ? `${dia} de ${mes}` : data;
  }

  // "No Campo" é o único estado realmente "ativo" no sentido literal (servindo em campo agora);
  // "Sede da Igreja" e "Preenchendo" não são estados negativos, só estágios diferentes do
  // processo — por isso ambos caem em neutro, não em "negativo" (vermelho).
  statusClasse(status: string): string {
    return status === 'No Campo' ? 'rx-campo-positivo' : 'rx-campo-neutro';
  }

  // Chamado pelo (error) do <img> — troca pra um ícone genérico se o link da foto falhar
  // ao carregar, em vez de deixar o "ícone quebrado" padrão do navegador.
  onFotoErro(pessoa: MissionarioDetalhe): void {
    pessoa.fotoQuebrada = true;
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }

  // Gráfico de pizza 3D (CSS puro, ver .html/.css) — No Campo x Sede da Igreja x Preenchendo,
  // 3 fatias (diferente do padrão de 2 fatias usado em missionarios-retornados/
  // membros-adultos-solteiros). Os cortes em graus vêm direto das contagens brutas (não dos
  // percentuais já arredondados de resumoMissionarios), pra nunca deixar gap/sobreposição de
  // 1° na borda entre as cores por causa de arredondamento independente.
  get pizzaGradiente(): string {
    const total = this.resumoMissionarios.total.valor;
    if (total === 0) {
      return '#e2e8f0';
    }
    const anguloNoCampo = (this.resumoMissionarios.noCampo.valor / total) * 360;
    const anguloSedeIgreja = anguloNoCampo + (this.resumoMissionarios.sedeIgreja.valor / total) * 360;
    return `conic-gradient(#16a34a 0deg ${anguloNoCampo}deg, #2563eb ${anguloNoCampo}deg ${anguloSedeIgreja}deg, #f59e0b ${anguloSedeIgreja}deg 360deg)`;
  }

  // Lista efetivamente exibida na aba Detalhes — aplica o filtro do card clicado no Resumo
  // (ou mostra todo mundo quando não há filtro ativo).
  get detalhesFiltrados(): MissionarioDetalhe[] {
    switch (this.filtroAtivo) {
      case 'noCampo':
        return this.detalhesMissionarios.filter(p => p.status === 'No Campo');
      case 'sedeIgreja':
        return this.detalhesMissionarios.filter(p => p.status === 'Sede da Igreja');
      case 'preenchendo':
        return this.detalhesMissionarios.filter(p => p.status === 'Preenchendo');
      default:
        return this.detalhesMissionarios;
    }
  }

  get labelFiltroAtivo(): string | null {
    return this.filtroAtivo ? MissionariosNaAtivaComponent.LABEL_FILTRO[this.filtroAtivo] : null;
  }

  // Acionado pelo botão "Detalhes" de cada card do Resumo — troca de aba e já aplica o filtro
  // correspondente.
  detalharCard(filtro: FiltroDetalhe): void {
    this.filtroAtivo = filtro;
    this.abaAtiva = 'detalhes';
  }

  limparFiltro(): void {
    this.filtroAtivo = null;
  }
}
