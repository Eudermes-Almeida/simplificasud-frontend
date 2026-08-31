import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import type ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { FrequenciaSacramentalDTO, RaioxApiService } from '../../services/raiox-api.service';

const MESES_ABREVIADOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-frequencia-sacramental',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frequencia-sacramental.component.html',
  styleUrl: './frequencia-sacramental.component.css'
})
export class FrequenciaSacramentalComponent implements OnChanges, OnDestroy {

  // Nome real da unidade (ex: "Ala Betim 1" ou "Estaca Betim"), recebido do pai.component —
  // é o que dispara a busca no backend.
  @Input() unidade = '';

  @ViewChild('graficoFrequencia') graficoFrequenciaEl?: ElementRef<HTMLDivElement>;

  // Define qual aba começa aberta por padrão
  abaAtiva: string = 'resumo';

  carregando = false;
  erroCarregamento: string | null = null;

  // Fonte única dos números do card de Resumo — evolução, evolução % e projeção
  // são sempre derivadas daqui, nunca guardadas à parte.
  resumoFrequencia = {
    atual: 0,
    anoAnterior: 0,
  };

  get evolucao(): number {
    return this.resumoFrequencia.atual - this.resumoFrequencia.anoAnterior;
  }

  get evolucaoPercentual(): number {
    return Math.round((this.evolucao / this.resumoFrequencia.anoAnterior) * 100);
  }

  get evolucaoPositiva(): boolean {
    return this.evolucao >= 0;
  }

  // Projeção para daqui a 5 anos: projeta a evolução anual atual (evolucao) 5 vezes à
  // frente a partir do valor atual — regra dada pelo usuário, não uma média histórica.
  get projecaoCincoAnos(): number {
    return this.resumoFrequencia.atual + this.evolucao * 5;
  }

  // Cada mês com a variação em relação ao mês anterior — derivado de historicoFrequencia,
  // nunca guardado à parte, para não correr o risco de os dois ficarem inconsistentes.
  get historicoComVariacao(): { mes: string; valor: number; variacao: number | null; isAtual: boolean }[] {
    return this.historicoFrequencia.map((item, index, arr) => ({
      mes: item.mes,
      valor: item.valor,
      variacao: index > 0 ? item.valor - arr[index - 1].valor : null,
      isAtual: index === arr.length - 1,
    }));
  }

  // Histórico mês a mês: fonte única usada pela tabela (Detalhes) e pelo gráfico (Gráfico).
  // Vem da API (ver buscarDados) — começa vazio até a primeira resposta chegar.
  historicoFrequencia: { mes: string; valor: number }[] = [];

  private grafico?: ApexCharts;
  private observadorRedimensionamento?: ResizeObserver;

  constructor(private raioxApiService: RaioxApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidade'] && this.unidade) {
      this.buscarDados();
    }
  }

  private buscarDados(): void {
    this.carregando = true;
    this.erroCarregamento = null;

    this.raioxApiService.buscaFrequenciaSacramental(this.unidade).subscribe({
      next: (dados) => {
        this.historicoFrequencia = this.agruparPorMes(dados);

        const ultimo = this.historicoFrequencia.at(-1);
        const primeiro = this.historicoFrequencia[0];
        this.resumoFrequencia.atual = ultimo?.valor ?? 0;
        // A tabela só retém os últimos 12 meses, então o registro mais antigo do período
        // é, por definição, o mesmo mês do ano anterior — não precisa de uma segunda busca.
        this.resumoFrequencia.anoAnterior = primeiro?.valor ?? 0;

        this.carregando = false;

        // Se o usuário já tinha aberto a aba Gráfico antes da resposta chegar, o gráfico foi
        // renderizado com dados vazios — atualiza a série existente em vez de esperar outro clique.
        this.grafico?.updateOptions({
          series: [{ name: 'Frequência Média', data: this.historicoFrequencia.map(item => item.valor) }],
          xaxis: { categories: this.historicoFrequencia.map(item => item.mes) },
        });
      },
      error: (err) => {
        this.erroCarregamento = 'Não foi possível carregar os dados de frequência sacramental.';
        this.carregando = false;
        console.error('Erro ao buscar frequência sacramental:', err);
      },
    });
  }

  // Agrupa por mês (anomes) somando a frequência — resolve tanto uma unidade específica
  // (um valor por mês) quanto "Estaca Betim" (várias unidades por mês, soma = total da estaca).
  private agruparPorMes(dados: FrequenciaSacramentalDTO[]): { mes: string; valor: number }[] {
    const somaPorAnomes = new Map<string, number>();

    for (const item of dados) {
      const somaAtual = somaPorAnomes.get(item.anomes) ?? 0;
      somaPorAnomes.set(item.anomes, somaAtual + Number(item.frequencia));
    }

    return Array.from(somaPorAnomes.entries())
      .sort(([anomesA], [anomesB]) => anomesA.localeCompare(anomesB))
      .map(([anomes, valor]) => ({ mes: this.formatarMes(anomes), valor }));
  }

  // "2026-08-01" -> "Ago/26". Parseado por string, não por Date, para não sofrer com
  // fuso horário deslocando o dia 1 do mês para o mês anterior em UTC-negativo.
  private formatarMes(anomes: string): string {
    const [ano, mes] = anomes.split('-');
    const indiceMes = Number(mes) - 1;
    return `${MESES_ABREVIADOS[indiceMes]}/${ano.slice(2)}`;
  }

  // Função que altera a aba ativa ao clicar
  mudarAba(nomeDaAba: string): void {
    this.abaAtiva = nomeDaAba;

    if (nomeDaAba === 'grafico' && !this.grafico) {
      // Adia até o Angular aplicar a classe "show active" e o container ficar visível/medível
      setTimeout(() => this.renderizarGrafico(), 0);
    }
  }

  private async renderizarGrafico(): Promise<void> {
    if (!this.graficoFrequenciaEl) {
      return;
    }

    const { default: ApexCharts } = await import('apexcharts');

    const corLinha = '#2563eb';
    const corTexto = '#64748b';
    const ultimoIndice = this.historicoFrequencia.length - 1;

    const opcoes: ApexOptions = {
      chart: {
        type: 'area',
        height: 340,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { easing: 'easeinout', speed: 600 },
      },
      series: [{
        name: 'Frequência Média',
        data: this.historicoFrequencia.map(item => item.valor),
      }],
      xaxis: {
        categories: this.historicoFrequencia.map(item => item.mes),
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, stroke: { color: '#94a3b8', width: 1, dashArray: 4 } },
        labels: { style: { colors: corTexto, fontSize: '12px', fontWeight: 600 } },
      },
      yaxis: {
        min: 0,
        labels: { style: { colors: corTexto, fontSize: '12px' } },
      },
      stroke: { curve: 'smooth', width: 3 },
      colors: [corLinha],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
      },
      markers: {
        size: 5,
        colors: [corLinha],
        strokeColors: '#ffffff',
        strokeWidth: 2,
        hover: { size: 7 },
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
        formatter: (val, opts) => opts?.dataPointIndex === ultimoIndice ? `${val}` : '',
        offsetY: -16,
        style: { colors: ['#ffffff'], fontSize: '13px', fontWeight: 700 },
        background: {
          enabled: true,
          backgroundColor: '#163a6b',
          borderRadius: 6,
          padding: 6,
          borderWidth: 0,
          opacity: 1,
          dropShadow: { enabled: true, top: 2, left: 0, blur: 4, opacity: 0.25 },
        },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, left: 8, right: 16 },
      },
      legend: { show: false },
      tooltip: {
        shared: true,
        intersect: false,
        theme: 'light',
        y: { formatter: (val: number) => `${val} pessoas` },
      },
    };

    this.grafico = new ApexCharts(this.graficoFrequenciaEl.nativeElement, opcoes);
    await this.grafico.render();

    // O container fica dentro de um accordion/tab animado: o tamanho real só
    // se estabiliza após a transição, então mantemos o gráfico sincronizado com ela.
    this.observadorRedimensionamento = new ResizeObserver((entradas) => {
      const { width, height } = entradas[0].contentRect;
      // Ignora redimensionamentos para 0 (aba escondida via display:none) —
      // redesenhar nesse estado corrompe o layout dos rótulos do eixo X.
      if (width > 0 && height > 0) {
        this.grafico?.updateOptions({}, false, true);
      }
    });
    this.observadorRedimensionamento.observe(this.graficoFrequenciaEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.observadorRedimensionamento?.disconnect();
    this.grafico?.destroy();
  }
}
