import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RaioxApiService } from '../../services/raiox-api.service';

type AbaJovens = 'resumo' | 'rapazes' | 'mocas' | 'criancas';

interface GrupoResumo {
  nome: string;
  icone: string;
  ativos: number;
  total: number;
  nota?: string;
}

interface Rapaz {
  nome: string;
  idade: number;
  sacerdocio: string;
}

interface Moca {
  nome: string;
  idade: number;
}

interface Crianca {
  nome: string;
  sexo: 'M' | 'F';
  idade: number;
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

  // Ainda não há dados reais no banco para este escopo (metas/matrículas do seminário) —
  // mock mantido de propósito até o backend cobrir essas métricas.
  resumoJovens: GrupoResumo[] = [
    { nome: 'Rapazes', icone: 'bi-gender-male', ativos: 2, total: 8 },
    { nome: 'Moças', icone: 'bi-gender-female', ativos: 2, total: 8 },
    { nome: 'Crianças', icone: 'bi-emoji-smile-fill', ativos: 6, total: 12 },
    {
      nome: 'Matrículas Seminário',
      icone: 'bi-book-half',
      ativos: 4,
      total: 4,
      nota: 'Alunos com frequência média acima de 75%'
    }
  ];

  rapazes: Rapaz[] = [];
  mocas: Moca[] = [];
  criancas: Crianca[] = [];

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
    }).subscribe({
      next: ({ rapazes, mocas, criancas }) => {
        this.rapazes = rapazes.map(dto => ({ nome: dto.nome, idade: Number(dto.idade), sacerdocio: dto.sacerdocio }));
        this.mocas = mocas.map(dto => ({ nome: dto.nome, idade: Number(dto.idade) }));
        this.criancas = criancas.map(dto => ({ nome: dto.nome, sexo: dto.sexo as 'M' | 'F', idade: Number(dto.idade) }));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de jovens e crianças.';
        this.carregando = false;
        console.error('Erro ao buscar rapazes/moças/crianças:', err);
      },
    });
  }

  mudarAba(aba: AbaJovens): void {
    this.abaAtiva = aba;
  }

  percentual(item: GrupoResumo): number {
    return item.total === 0 ? 0 : Math.round((item.ativos / item.total) * 100);
  }

  sacerdocioClasse(status: string): string {
    return status === 'Não Ordenado' ? 'rx-campo-negativo' : 'rx-campo-positivo';
  }
}
