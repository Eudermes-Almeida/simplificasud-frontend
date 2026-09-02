import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FrequenciaSacramentalComponent } from '../frequencia-sacramental/frequencia-sacramental.component';
import { RecemConversosComponent } from '../recem-conversos/recem-conversos.component';
import { SeminarioComponent } from '../seminario/seminario.component';
import { QualificacaoUnidadeComponent } from '../qualificacao-unidade/qualificacao-unidade.component';
import { PrioridadesProfeticasComponent } from '../prioridades-profeticas/prioridades-profeticas.component';
import { HomensAvancandoSacerdocioComponent } from '../homens-avancando-sacerdocio/homens-avancando-sacerdocio.component';
import { ReunioesAtividadesLancamentosComponent } from '../reunioes-atividades-lancamentos/reunioes-atividades-lancamentos.component';
import { JovensCriancasComponent } from '../jovens-criancas/jovens-criancas.component';
import { RodapeComponent } from '../rodape/rodape.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pai',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgbAccordionModule, FrequenciaSacramentalComponent, RecemConversosComponent, SeminarioComponent, QualificacaoUnidadeComponent, PrioridadesProfeticasComponent, HomensAvancandoSacerdocioComponent, ReunioesAtividadesLancamentosComponent, JovensCriancasComponent, RodapeComponent],
  templateUrl: './pai.component.html',
  styleUrl: './pai.component.css'
})
export class PaiComponent {
  @Output() sair = new EventEmitter<void>();

  private unidadesTodas = [
    { value: 'estaca-betim', label: 'Estaca Betim' },
    { value: 'ala-betim-1', label: 'Ala Betim 1' },
    { value: 'ala-betim-2', label: 'Ala Betim 2' },
    { value: 'ala-divinopolis-1', label: 'Ala Divinópolis 1' },
    { value: 'ala-divinopolis-2', label: 'Ala Divinópolis 2' },
    { value: 'ala-itauna', label: 'Ala Itaúna' },
    { value: 'ala-jardim-alterosas', label: 'Ala Jardim das Alterosas' },
    { value: 'ramo-juatuba', label: 'Ramo Juatuba' },
    { value: 'ramo-nova-serrana', label: 'Ramo Nova Serrana' },
    { value: 'ramo-para-minas', label: 'Ramo Pará de Minas' },
  ];

  unidadeSelecionada: string;

  constructor(private authService: AuthService) {
    // Escopo "Ala": trava a unidade na do próprio líder (não mostra seletor pras
    // outras). Escopo "Estaca": vê tudo, comportamento igual ao de antes do login existir.
    const minhaUnidade = this.unidadesTodas.find(u => u.label === this.authService.getUnidade());
    this.unidadeSelecionada = (this.escopoRestrito && minhaUnidade) ? minhaUnidade.value : this.unidadesTodas[0].value;
  }

  get escopoRestrito(): boolean {
    return this.authService.getEscopo().toLowerCase() === 'ala';
  }

  get nomeLogado(): string {
    return this.authService.getNome();
  }

  get unidades() {
    if (this.escopoRestrito) {
      const minhaUnidade = this.unidadesTodas.find(u => u.label === this.authService.getUnidade());
      return minhaUnidade ? [minhaUnidade] : this.unidadesTodas;
    }
    return this.unidadesTodas;
  }

  // A API espera o nome real da unidade (ex: "Ala Betim 1"), não o slug do seletor
  // (ex: "ala-betim-1") — esta é a fonte única dessa conversão para os componentes filhos.
  get unidadeSelecionadaLabel(): string {
    return this.unidades.find(u => u.value === this.unidadeSelecionada)?.label ?? '';
  }
}
