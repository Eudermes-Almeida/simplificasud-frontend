import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaioxApiService } from '../../services/raiox-api.service';

interface Homem {
  nome: string;
  idade: number;
  ativo: boolean;
}

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

  carregando = false;
  erroCarregamento: string | null = null;

  homens: Homem[] = [];

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    this.raioxApiService.buscaHomensPreparados(this.unidade).subscribe({
      next: (dados) => {
        this.homens = dados.map(dto => ({
          nome: dto.nome,
          idade: Number(dto.idade),
          ativo: dto.ativo === 'Sim',
        }));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de homens avançando ao sacerdócio.';
        this.carregando = false;
        console.error('Erro ao buscar homens preparados:', err);
      },
    });
  }

  ativoClasse(ativo: boolean): string {
    return ativo ? 'rx-campo-positivo' : 'rx-campo-negativo';
  }
}
