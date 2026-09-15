import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RaioxApiService } from '../../services/raiox-api.service';

type AbaJovens = 'resumo' | 'rapazes' | 'mocas' | 'criancas';

// Filtro por faixa etária nas abas Rapazes/Moças — mesmo padrão de radio-pill já usado em
// membros-adultos-solteiros.component.ts (filtroRecomendacao), aqui sem variante de cor porque
// faixa etária não é um julgamento "bom/ruim".
type FiltroIdade = 'todos' | 'menores13' | 'maiores14';

// Filtro da aba Crianças — berçário é 18 meses a 3 anos (ver nota exibida no template), mas
// "idade" só vem em anos completos, sem granularidade de mês. Aproximação assumida: idade
// entre 1 e 3 anos (exclui idade=0, que é sempre < 18 meses; inclui todo o ano de 1 ano, já
// que uma fração dele — 18 a 23 meses — pertence ao berçário e não há como separar sem o mês
// de nascimento).
type FiltroCrianca = 'todos' | 'bercario';

interface GrupoResumo {
  nome: string;
  icone: string;
  ativos: number;
  total: number;
  // Rótulos customizáveis por card — Matrículas Seminário precisa de textos diferentes
  // do padrão "Total"/"Ativos" e não mostra percentual (ver mostrarPercentual).
  labelTotal?: string;
  labelAtivos?: string;
  mostrarPercentual?: boolean;
  // Dá um acento de cor diferente (âmbar) ao ícone deste card específico —
  // usado só em Matrículas Seminário pra ele não ficar "sem vida" ao lado
  // dos outros 3 cards, todos com o mesmo ícone azul-padrão.
  iconeDestaque?: boolean;
  // Só definido nos cards Rapazes/Moças — quantidade com recomendação de
  // batistério ativa. undefined nos demais cards (Crianças/Matrículas Seminário),
  // que não têm essa informação na tabela resumojovens.
  recomendacaoBatisterio?: number;
}

interface Rapaz {
  nome: string;
  idade: number;
  unidade: string;
  sacerdocio: string;
  recomendacaoBatisterio: string;
}

interface Moca {
  nome: string;
  idade: number;
  unidade: string;
  recomendacaoBatisterio: string;
}

// Status calculado da Recomendação Batistério (rx-campo-positivo/negativo/neutro
// já existem em styles.css, reaproveitados aqui em vez de criar cores novas).
interface StatusRecomendacao {
  texto: string;
  classe: string;
}

interface Crianca {
  nome: string;
  sexo: 'M' | 'F';
  idade: number;
  unidade: string;
}

@Component({
  selector: 'app-jovens-criancas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jovens-criancas.component.html',
  styleUrl: './jovens-criancas.component.css'
})
export class JovensCriancasComponent implements OnChanges {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  abaAtiva: AbaJovens = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  resumoJovens: GrupoResumo[] = [];

  rapazes: Rapaz[] = [];
  mocas: Moca[] = [];
  criancas: Crianca[] = [];

  // Filtro de faixa etária independente por aba — trocar o filtro de Rapazes não deve afetar
  // a listagem de Moças, e vice-versa.
  filtroIdadeRapazes: FiltroIdade = 'todos';
  filtroIdadeMocas: FiltroIdade = 'todos';

  // Filtro da aba Crianças (berçário) — mesma lógica de reset por unidade dos outros dois.
  filtroCrianca: FiltroCrianca = 'todos';

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    forkJoin({
      rapazes: this.raioxApiService.buscaRapazes(this.unidade),
      mocas: this.raioxApiService.buscaMocas(this.unidade),
      criancas: this.raioxApiService.buscaCriancas(this.unidade),
      resumo: this.raioxApiService.buscaResumoJovens(this.unidade),
    }).subscribe({
      next: ({ rapazes, mocas, criancas, resumo }) => {
        // Backend omite a chave (JSON-B) quando recomendacao_batisterio vem nulo no banco
        // (registros com dado quebrado, ex: idade='*') — normaliza pro mesmo texto usado
        // pra quem nunca teve recomendação emitida, igual já feito em recem-conversos.
        this.rapazes = rapazes.map(dto => ({
          nome: dto.nome,
          idade: Number(dto.idade),
          unidade: dto.unidade,
          sacerdocio: dto.sacerdocio,
          recomendacaoBatisterio: dto.recomendacao_batisterio || 'Não Emitida',
        }));
        this.mocas = mocas.map(dto => ({
          nome: dto.nome,
          idade: Number(dto.idade),
          unidade: dto.unidade,
          recomendacaoBatisterio: dto.recomendacao_batisterio || 'Não Emitida',
        }));
        this.criancas = criancas.map(dto => ({ nome: dto.nome, sexo: dto.sexo as 'M' | 'F', idade: Number(dto.idade), unidade: dto.unidade }));

        // Troca de unidade não deve carregar um filtro escolhido antes — sempre volta pra "todos".
        this.filtroIdadeRapazes = 'todos';
        this.filtroIdadeMocas = 'todos';
        this.filtroCrianca = 'todos';

        // "Estaca Betim" traz 1 linha por unidade (9 no total) — somar sempre funciona,
        // seja 1 unidade específica (soma = no-op) ou a estaca inteira (soma = total real).
        const somar = (campo: keyof typeof resumo[0]) =>
          resumo.reduce((acc, item) => acc + Number(item[campo]), 0);

        this.resumoJovens = [
          { nome: 'Rapazes', icone: 'bi-gender-male', ativos: somar('rapazes_ativos'), total: somar('rapazes_total'), labelAtivos: 'Ativos', recomendacaoBatisterio: somar('rapazes_recomendacao_batisterio') },
          { nome: 'Moças', icone: 'bi-gender-female', ativos: somar('mocas_ativas'), total: somar('mocas_total'), labelAtivos: 'Ativas', recomendacaoBatisterio: somar('mocas_recomendacao_batisterio') },
          { nome: 'Crianças', icone: 'bi-emoji-smile-fill', ativos: somar('criancas_total_ativas'), total: somar('total_criancas'), labelAtivos: 'Ativas' },
          {
            nome: 'Matrículas Seminário',
            icone: 'bi-book-half',
            ativos: somar('frequencia_acima_75'),
            total: somar('total_matriculados_seminario'),
            labelTotal: 'Total Matrículas',
            labelAtivos: 'Alunos com frequência acima de 75%',
            iconeDestaque: true
          }
        ];

        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de jovens e crianças.';
        this.carregando = false;
        console.error('Erro ao buscar rapazes/moças/crianças/resumo:', err);
      },
    });
  }

  mudarAba(aba: AbaJovens): void {
    this.abaAtiva = aba;
  }

  percentual(item: GrupoResumo): number {
    return item.total === 0 ? 0 : Math.round((item.ativos / item.total) * 100);
  }

  // Percentual da Recomendação Batistério é relativo aos jovens ativos (não ao total),
  // por pedido explícito do usuário — denominador diferente do percentual() acima.
  percentualRecomendacaoBatisterio(item: GrupoResumo): number {
    return item.ativos === 0 ? 0 : Math.round(((item.recomendacaoBatisterio ?? 0) / item.ativos) * 100);
  }

  labelTotal(item: GrupoResumo): string {
    return item.labelTotal ?? 'Total';
  }

  labelAtivos(item: GrupoResumo): string {
    return item.labelAtivos ?? 'Ativos';
  }

  mostrarPercentual(item: GrupoResumo): boolean {
    return item.mostrarPercentual !== false;
  }

  // Mesmo corte >=75% verde / <75% vermelho já usado no componente seminario
  // (frequenciaClasse) — reaproveitado aqui pro número/percentual de "ativos".
  classeAtivos(item: GrupoResumo): string {
    return this.percentual(item) >= 75 ? 'rx-progresso-num-positivo' : 'rx-progresso-num-negativo';
  }

  sacerdocioClasse(status: string): string {
    return status === 'Não Ordenado' ? 'rx-campo-negativo' : 'rx-campo-positivo';
  }

  // Recomendação Batistério: valor vem "dd/mm/aaaa" (vencimento) ou "Não Emitida".
  // Comparação considera só mês/ano (regra explícita do usuário) — um dia qualquer
  // do mês de vencimento não importa, e vencendo no mês atual ainda conta como ativa.
  statusRecomendacaoBatisterio(valor: string): StatusRecomendacao {
    if (!valor || valor === 'Não Emitida') {
      return { texto: 'Não Emitida', classe: 'rx-campo-neutro' };
    }

    const [, mesStr, anoStr] = valor.split('/');
    const mesVencimento = Number(mesStr);
    const anoVencimento = Number(anoStr);

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const vencida = anoVencimento < anoAtual || (anoVencimento === anoAtual && mesVencimento < mesAtual);

    return vencida
      ? { texto: `Vencida em ${valor}`, classe: 'rx-campo-negativo' }
      : { texto: `Ativa vence em ${valor}`, classe: 'rx-campo-positivo' };
  }

  mudarFiltroIdadeRapazes(valor: FiltroIdade): void {
    this.filtroIdadeRapazes = valor;
  }

  mudarFiltroIdadeMocas(valor: FiltroIdade): void {
    this.filtroIdadeMocas = valor;
  }

  // "Menores que 13 anos" inclui o 13 e "Maiores de 14 anos" inclui o 14 (pedido explícito do
  // usuário) — não há sobreposição nem lacuna entre as duas faixas.
  private aplicarFiltroIdade<T extends { idade: number }>(lista: T[], filtro: FiltroIdade): T[] {
    if (filtro === 'menores13') return lista.filter(p => p.idade <= 13);
    if (filtro === 'maiores14') return lista.filter(p => p.idade >= 14);
    return lista;
  }

  get rapazesFiltrados(): Rapaz[] {
    return this.aplicarFiltroIdade(this.rapazes, this.filtroIdadeRapazes);
  }

  get mocasFiltradas(): Moca[] {
    return this.aplicarFiltroIdade(this.mocas, this.filtroIdadeMocas);
  }

  // Totalizador exibido dentro de cada pill do filtro (ex.: "Todos (140)") — mesma lista/regra
  // de aplicarFiltroIdade, só trocando o retorno por .length.
  private contarPorFiltroIdade<T extends { idade: number }>(lista: T[], filtro: FiltroIdade): number {
    return this.aplicarFiltroIdade(lista, filtro).length;
  }

  get contagemIdadeRapazes(): Record<FiltroIdade, number> {
    return {
      todos: this.contarPorFiltroIdade(this.rapazes, 'todos'),
      menores13: this.contarPorFiltroIdade(this.rapazes, 'menores13'),
      maiores14: this.contarPorFiltroIdade(this.rapazes, 'maiores14'),
    };
  }

  get contagemIdadeMocas(): Record<FiltroIdade, number> {
    return {
      todos: this.contarPorFiltroIdade(this.mocas, 'todos'),
      menores13: this.contarPorFiltroIdade(this.mocas, 'menores13'),
      maiores14: this.contarPorFiltroIdade(this.mocas, 'maiores14'),
    };
  }

  mudarFiltroCrianca(valor: FiltroCrianca): void {
    this.filtroCrianca = valor;
  }

  private aplicarFiltroCrianca(lista: Crianca[], filtro: FiltroCrianca): Crianca[] {
    if (filtro === 'bercario') return lista.filter(c => c.idade >= 1 && c.idade <= 3);
    return lista;
  }

  get criancasFiltradas(): Crianca[] {
    return this.aplicarFiltroCrianca(this.criancas, this.filtroCrianca);
  }

  get contagemCriancas(): Record<FiltroCrianca, number> {
    return {
      todos: this.aplicarFiltroCrianca(this.criancas, 'todos').length,
      bercario: this.aplicarFiltroCrianca(this.criancas, 'bercario').length,
    };
  }
}
