import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recem-conversos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recem-conversos.component.html',
  styleUrl: './recem-conversos.component.css'
})
export class RecemConversosComponent {
  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  // Dados reais extraídos da planilha de Recém-Conversos
  resumoConversos = {
    qtBatismos: { valor: 10, pct: 100 },
    ativos: { valor: 6, pct: 60},
    sexoMasculino: { valor: 6, pct: 60 },
    ordenandosSacerdocio: { valor: 1, pct: 17 },
    comRecomendacaoTemplos: { valor: 1, pct: 10 },
    receberamChamado: { valor: 0, pct: 0 },
    comMinistradores: { valor: 8, pct: 80 }
  };

  // Lista de recém-conversos (fonte única usada pela tabela da aba Detalhes)
  detalhesConversos = [
    { nome: 'Brasilio Da Silva, Fagner Henrique', idade: 23, ativo: false, chamado: false, ministrador: false, recomendacao: 'Não Emitida', sacerdocio: 'Não ordenado' },
    { nome: 'Cardoso, Moacir', idade: 73, ativo: false, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não ordenado' },
    { nome: 'De Paula Faria, Luiz Felipe', idade: 20, ativo: false, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não ordenado' },
    { nome: 'Dos Santos, Valmir Conceição', idade: 50, ativo: false, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não ordenado' },
    { nome: 'Ferreira dos Anjos, Otavio Henrique', idade: 25, ativo: true, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não ordenado' },
    { nome: 'Gonçalves Lourenço, Neli Terezinha', idade: 48, ativo: true, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não se aplica' },
    { nome: 'Larissa De Souza Rocha, Sabrina', idade: 44, ativo: true, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não se aplica' },
    { nome: 'Penna Machado, Bruna', idade: 34, ativo: true, chamado: false, ministrador: true, recomendacao: '31/10/2026', sacerdocio: 'Não se aplica' },
    { nome: 'Pereira, Adrielle', idade: 24, ativo: true, chamado: false, ministrador: true, recomendacao: 'Não Emitida', sacerdocio: 'Não se aplica' },
    { nome: 'Silva, Othon de Paula Menezes', idade: 13, ativo: true, chamado: false, ministrador: false, recomendacao: 'Não Emitida', sacerdocio: 'Diácono' },
  ];

  sacerdocioClasse(valor: string): string {
    if (valor === 'Não se aplica') return 'rx-campo-neutro';
    if (valor === 'Não ordenado') return 'rx-campo-negativo';
    return 'rx-campo-positivo';
  }

  recomendacaoEmitida(valor: string): boolean {
    return valor !== 'Não Emitida';
  }

  // Ministradores designados por recém-converso (fonte única usada pelos cards da aba Ministradores)
  // "sexo" define se o card de Ministradora é renderizado: homens só têm Ministrador.
  ministradoresConversos = [
    { nome: 'Brasilio Da Silva, Fagner Henrique', sexo: 'M', ministrador: [], ministradora: [] as string[] },
    { nome: 'Cardoso, Moacir', sexo: 'M', ministrador: ['Márcio Silva', 'Miraldo Santos'], ministradora: [] as string[] },
    { nome: 'De Paula Faria, Luiz Felipe', sexo: 'M', ministrador: ['Miguel Gama', 'Romulo Gama'], ministradora: [] as string[] },
    { nome: 'Dos Santos, Valmir Conceição', sexo: 'M', ministrador: ['Márcio Silva', 'Miraldo Santos'] as string[], ministradora: [] as string[] },
    { nome: 'Ferreira dos Anjos, Otavio Henrique', sexo: 'M', ministrador: ['Gustavo Rodrigues', 'Marcos Rocha'], ministradora: [] as string[] },
    { nome: 'Gonçalves Lourenço, Neli Terezinha', sexo: 'F', ministrador: ['Márcio Silva', 'Miraldo Santos'], ministradora: ['Raquel Oliveira', 'Alcione Ferreira'] },
    { nome: 'Larissa De Souza Rocha, Sabrina', sexo: 'F', ministrador: ['Juliano Costa'], ministradora: ['Laura Costa'] },
    { nome: 'Penna Machado, Bruna', sexo: 'F', ministrador: [], ministradora: ['Gabriela Santos', 'Ana Paula Dias de Oliveira Santo'] },
    { nome: 'Pereira, Adrielle', sexo: 'F', ministrador: ['Marcos Rocha', 'Gustavo Rodrigues'], ministradora: ['Lucélia Gomes dos Santos', 'Ana Ribeiro'] },
    { nome: 'Silva, Othon de Paula Menezes', sexo: 'M', ministrador: [] as string[], ministradora: [] as string[] },
  ];

  // Histórico de Meses (Mantido para a aba Detalhes)
  historicoComVariacao = [
    { mes: 'Set/25', valor: 1, variacao: null, isAtual: false },
    { mes: 'Out/25', valor: 2, variacao: 1, isAtual: false },
    { mes: 'Nov/25', valor: 1, variacao: -1, isAtual: false },
    { mes: 'Dez/25', valor: 3, variacao: 2, isAtual: false },
    { mes: 'Jan/26', valor: 0, variacao: -3, isAtual: false },
    { mes: 'Fev/26', valor: 1, variacao: 1, isAtual: false },
    { mes: 'Mar/26', valor: 2, variacao: 1, isAtual: false },
    { mes: 'Abr/26', valor: 0, variacao: -2, isAtual: false },
    { mes: 'Mai/26', valor: 1, variacao: 1, isAtual: false },
    { mes: 'Jun/26', valor: 2, variacao: 1, isAtual: false },
    { mes: 'Jul/26', valor: 1, variacao: -1, isAtual: false },
    { mes: 'Ago/26', valor: 1, variacao: 0, isAtual: true }
  ];

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }
}
