import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class HomensAvancandoSacerdocioComponent {
  // Dados extraídos fielmente da planilha (coluna Unidade omitida a pedido)
  homens: Homem[] = [
    { nome: 'Fernandes De Oliveira, Paulo', idade: 68, ativo: true },
    { nome: 'Ferreira, Jose Geraldo', idade: 69, ativo: true },
    { nome: 'Joseph, Leny', idade: 48, ativo: true },
    { nome: 'Mendes De Oliveira, Marcus Vinícius', idade: 36, ativo: true }
  ];

  ativoClasse(ativo: boolean): string {
    return ativo ? 'rx-campo-positivo' : 'rx-campo-negativo';
  }
}
