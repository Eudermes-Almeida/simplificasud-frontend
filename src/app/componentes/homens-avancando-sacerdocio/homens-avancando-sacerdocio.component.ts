import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomensPreparadosDTO, RaioxApiService } from '../../services/raiox-api.service';

interface HomemDetalhe {
  nome: string;
  idade: number;
  unidade: string;
  dataBatismo: string;
  chamado: boolean;
  chamadoNome: string;
  ministrador: boolean;
  recomendacao: string;
  sacerdocio: string;
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

  // Controle de Abas Internas
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos KPIs do card de Resumo — mesmo padrão de recem-conversos, sem o card
  // de Sexo Masculino (aqui 100% dos registros já são homens, a tabela não traz "sexo").
  resumoHomens = {
    qtBatismos: { valor: 0, pct: 100 },
    batismosUltimos30Dias: { valor: 0 },
    ordenandosSacerdocio: { valor: 0, pct: 0 },
    comRecomendacaoTemplos: { valor: 0, pct: 0 },
    receberamChamado: { valor: 0, pct: 0 },
    comMinistradores: { valor: 0, pct: 0 }
  };

  // Lista de homens sendo preparados (fonte única usada pelos cards da aba Detalhes)
  detalhesHomens: HomemDetalhe[] = [];

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
        // Mesmo cuidado de recem-conversos: o backend omite a chave (JSON-B) quando
        // sacerdocio/recomendacao/ministrador vêm nulos no banco — normaliza antes de
        // qualquer contagem/mapeamento pra nunca tratar "em branco" como valor real.
        const dadosNormalizados = dados.map(dto => ({
          ...dto,
          sacerdocio: dto.sacerdocio || 'Não Ordenado',
          recomendacao: dto.recomendacao || 'Não Emitida',
          ministrador: dto.ministrador || 'Não designado',
        }));

        this.resumoHomens = this.calcularResumo(dadosNormalizados);
        this.detalhesHomens = dadosNormalizados.map(dto => this.mapDetalhe(dto));
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de homens avançando ao sacerdócio.';
        this.carregando = false;
        console.error('Erro ao buscar homens preparados:', err);
      },
    });
  }

  private calcularResumo(dados: HomensPreparadosDTO[]): typeof this.resumoHomens {
    const total = dados.length;
    const pct = (contagem: number, base: number = total) => base > 0 ? Math.round((contagem / base) * 100) : 0;

    const batismosUltimos30Dias = dados.filter(d => this.hasBatismoNosUltimos30Dias(d.data_batismo)).length;
    const ordenandosSacerdocio = dados.filter(d => d.sacerdocio !== 'Não Ordenado').length;
    const comRecomendacaoTemplos = dados.filter(d => this.recomendacaoEmitida(d.recomendacao)).length;
    const receberamChamado = dados.filter(d => this.temChamado(d.tem_chamado)).length;
    const comMinistradores = dados.filter(d => !this.semDesignacao(d.ministrador)).length;

    return {
      qtBatismos: { valor: total, pct: 100 },
      batismosUltimos30Dias: { valor: batismosUltimos30Dias },
      ordenandosSacerdocio: { valor: ordenandosSacerdocio, pct: pct(ordenandosSacerdocio) },
      comRecomendacaoTemplos: { valor: comRecomendacaoTemplos, pct: pct(comRecomendacaoTemplos) },
      receberamChamado: { valor: receberamChamado, pct: pct(receberamChamado) },
      comMinistradores: { valor: comMinistradores, pct: pct(comMinistradores) },
    };
  }

  private mapDetalhe(dto: HomensPreparadosDTO): HomemDetalhe {
    return {
      nome: dto.nome,
      idade: Number(dto.idade),
      unidade: dto.unidade,
      dataBatismo: this.formatarDataBrasileira(dto.data_batismo),
      chamado: this.temChamado(dto.tem_chamado),
      chamadoNome: dto.tem_chamado,
      ministrador: !this.semDesignacao(dto.ministrador),
      recomendacao: dto.recomendacao,
      sacerdocio: dto.sacerdocio,
    };
  }

  // Valores de "sem designação" já usados na origem em momentos diferentes (mesma planilha
  // de detalhesconversos) — ver recem-conversos.component.ts pela mesma convenção.
  private static readonly SEM_DESIGNACAO = ['Sem Designação', 'Não designado'];

  private semDesignacao(valor: string): boolean {
    return HomensAvancandoSacerdocioComponent.SEM_DESIGNACAO.includes(valor);
  }

  // tem_chamado vem da API como "Sem chamado" ou o nome do próprio cargo (ex: "Secretário
  // do Quórum de Élderes") - nunca um booleano "Sim"/"Não".
  private temChamado(valor: string): boolean {
    return !!valor && valor !== 'Sem chamado';
  }

  // data_batismo vem da API em formato ISO (aaaa-mm-dd) - compara direto contra
  // "hoje - 30 dias" sem lib de datas.
  private hasBatismoNosUltimos30Dias(dataBatismo: string): boolean {
    const data = new Date(dataBatismo);
    if (isNaN(data.getTime())) return false;

    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    return data >= limite;
  }

  // Exibição (aba Detalhes) em dd/mm/aaaa — o valor bruto ISO segue intocado no resto do
  // fluxo (hasBatismoNosUltimos30Dias compara contra ele), essa é só a transformação de exibição.
  private formatarDataBrasileira(dataIso: string): string {
    const [ano, mes, dia] = (dataIso || '').split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataIso;
  }

  sacerdocioClasse(valor: string): string {
    if (valor === 'Não se aplica') return 'rx-campo-neutro';
    if (valor === 'Não Ordenado') return 'rx-campo-negativo';
    return 'rx-campo-positivo';
  }

  // Considera "ativa" tanto o status "Ativa" quanto qualquer variação "Vence..."
  // (vence este mês/em dois meses/em três meses) - a recomendação continua valendo
  // até vencer. Qualquer outro valor (ex: "Recomendação Não Emitida") não conta.
  recomendacaoEmitida(valor: string): boolean {
    return valor === 'Ativa' || valor.toLowerCase().includes('vence');
  }

  // O dado bruto da não-emitida já vem como "Recomendação Não Emitida" (repete o rótulo do
  // card, que já diz "Recomendação") — mostra só "Não Emitida" nesse caso; os demais valores
  // (Ativa/Vence...) continuam exibidos como vieram.
  textoRecomendacao(valor: string): string {
    return this.recomendacaoEmitida(valor) ? valor : 'Não Emitida';
  }

  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;
  }
}
