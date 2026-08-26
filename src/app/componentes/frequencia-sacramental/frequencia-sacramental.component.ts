import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import type ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';

@Component({
  selector: 'app-frequencia-sacramental',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frequencia-sacramental.component.html',
  styleUrl: './frequencia-sacramental.component.css'
})
export class FrequenciaSacramentalComponent implements OnDestroy {

  @ViewChild('graficoFrequencia') graficoFrequenciaEl?: ElementRef<HTMLDivElement>;

  // Define qual aba começa aberta por padrão
  abaAtiva: string = 'resumo';

  // Fonte única dos números do card de Resumo — evolução e evolução % são sempre derivadas daqui
  resumoFrequencia = {
    atual: 67,
    anoAnterior: 57,
    projecao5Anos: 107,
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

  // Histórico mês a mês: fonte única usada pela tabela (Detalhes) e pelo gráfico (Gráfico)
  historicoFrequencia: { mes: string; valor: number }[] = [
    { mes: 'Set/25', valor: 57 },
    { mes: 'Out/25', valor: 60 },
    { mes: 'Nov/25', valor: 76 },
    { mes: 'Dez/25', valor: 75 },
    { mes: 'Jan/26', valor: 70 },
    { mes: 'Fev/26', valor: 67 },
    { mes: 'Mar/26', valor: 71 },
    { mes: 'Abr/26', valor: 66 },
    { mes: 'Mai/26', valor: 69 },
    { mes: 'Jun/26', valor: 60 },
    { mes: 'Jul/26', valor: 65 },
    { mes: 'Ago/26', valor: 67 },
  ];

  private grafico?: ApexCharts;
  private observadorRedimensionamento?: ResizeObserver;

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
