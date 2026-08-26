import { Component } from '@angular/core';
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

@Component({
  selector: 'app-pai',
  standalone: true,
  imports: [FormsModule, NgSelectModule, NgbAccordionModule, FrequenciaSacramentalComponent, RecemConversosComponent, SeminarioComponent, QualificacaoUnidadeComponent, PrioridadesProfeticasComponent, HomensAvancandoSacerdocioComponent, ReunioesAtividadesLancamentosComponent, JovensCriancasComponent, RodapeComponent],
  templateUrl: './pai.component.html',
  styleUrl: './pai.component.css'
})
export class PaiComponent {
  unidades = [
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

  unidadeSelecionada = this.unidades[0].value;
}
