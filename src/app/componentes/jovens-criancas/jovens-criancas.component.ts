import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class JovensCriancasComponent {
  abaAtiva: AbaJovens = 'resumo';

  // Dados extraídos fielmente da tabela "Jovens e Crianças"
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

  // Dados extraídos fielmente da planilha (Ala Betim 1, coluna Unidade omitida
  // no card por ser igual pra todos os rapazes)
  rapazes: Rapaz[] = [
    { nome: 'Camarinha Muller Silveira Da, Theo', idade: 12, sacerdocio: 'Diácono' },
    { nome: 'Cândido De Sousa, Kevin', idade: 13, sacerdocio: 'Não Ordenado' },
    { nome: 'Faria, Miguel Augusto de', idade: 15, sacerdocio: 'Mestre' },
    { nome: 'Gama, Miguel Portes', idade: 14, sacerdocio: 'Mestre' },
    { nome: 'Gama, Rafael Portes', idade: 12, sacerdocio: 'Diácono' },
    { nome: 'Gomes, Renan Gabriel da Silva', idade: 13, sacerdocio: 'Não Ordenado' },
    { nome: 'Mavarez Moreno, Dorian Alexander', idade: 12, sacerdocio: 'Diácono' },
    { nome: 'Moreira, Samuel Abrão', idade: 17, sacerdocio: 'Diácono' },
    { nome: 'Oliveira Lima, Vitor Silvio de', idade: 14, sacerdocio: 'Diácono' },
    { nome: 'Oliveira, Icaro Martins', idade: 14, sacerdocio: 'Mestre' },
    { nome: 'Pereira, Lucas Gabriel dos Santos Martins', idade: 13, sacerdocio: 'Diácono' },
    { nome: 'Quijada Lyon, Jhon Keyber', idade: 16, sacerdocio: 'Sacerdote' },
    { nome: 'Reyes Bermudez, Albert Efrain', idade: 13, sacerdocio: 'Diácono' },
    { nome: 'Rodrigues, Gabriel Fellipe Costa', idade: 19, sacerdocio: 'Sacerdote' },
    { nome: 'Santos, Adryan de Oliveira', idade: 11, sacerdocio: 'Diácono' },
    { nome: 'Silva, Matheus de Paula Menezes da', idade: 17, sacerdocio: 'Não Ordenado' },
    { nome: 'Silva, Othon de Paula Menezes', idade: 13, sacerdocio: 'Diácono' }
  ];

  // Dados extraídos fielmente da planilha (Unidade omitida, igual pra todas)
  mocas: Moca[] = [
    { nome: 'Alícia', idade: 12 },
    { nome: 'Costa, Geovana Beatriz Pereira', idade: 12 },
    { nome: 'Costa, Xislene Pereira', idade: 16 },
    { nome: 'De Sousa, Talita Ester Lopes', idade: 13 },
    { nome: 'dos Santos, Maria Fernanda Barros', idade: 17 },
    { nome: 'Gama, Ana Portes', idade: 17 },
    { nome: 'Gomes, Renata Caroline da Silva', idade: 14 },
    { nome: 'Kesia', idade: 15 },
    { nome: 'Moreira, Sofia Emanuela', idade: 14 },
    { nome: 'Oliveira, Anneliza Arantes de', idade: 13 },
    { nome: 'Oliveira, Isabela Camarinha', idade: 17 },
    { nome: 'Oliveira, Mila Martins de', idade: 12 },
    { nome: 'Pena, Sarah Cristina Santos', idade: 17 },
    { nome: 'Pereira de Andrade, Gracielle Estefani', idade: 12 },
    { nome: 'Pereira, Anna Julia do Santos Martins', idade: 18 },
    { nome: 'Soares, Laura Gabrielly Costa', idade: 14 }
  ];

  // Dados extraídos fielmente da planilha (Unidade Atual omitida, igual pra todas)
  criancas: Crianca[] = [
    { nome: 'Simão, Ana Lua Souza', sexo: 'F', idade: 2 },
    { nome: 'Acosta, Ana Vitoria Ribeiro', sexo: 'F', idade: 10 },
    { nome: 'Costa, Elena Sara Loyola', sexo: 'F', idade: 7 },
    { nome: 'Costa, Kaylla Alexandra Nogueira', sexo: 'F', idade: 11 },
    { nome: 'Gael Mavarez, Dante', sexo: 'M', idade: 6 },
    { nome: 'Lima, Milena de Oliveira', sexo: 'F', idade: 9 },
    { nome: 'Mavarez Moreno, Oliver Owen', sexo: 'M', idade: 8 },
    { nome: 'Oliveira, Christopher Arantes de', sexo: 'M', idade: 11 },
    { nome: 'Santos, Luiz Fernando Bredoff Barros dos', sexo: 'M', idade: 9 },
    { nome: 'Silva Marques, Nicole', sexo: 'F', idade: 8 },
    { nome: 'Teixeira, Fernando Costa', sexo: 'M', idade: 11 },
    { nome: 'Teixeira, Mirela Joana Costa', sexo: 'F', idade: 9 }
  ];

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
