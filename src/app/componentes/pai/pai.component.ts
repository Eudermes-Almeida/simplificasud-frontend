import { Component } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { FrequenciaSacramentalComponent } from '../frequencia-sacramental/frequencia-sacramental.component';
import { RecemConversosComponent } from '../recem-conversos/recem-conversos.component';
import { SeminarioComponent } from '../seminario/seminario.component';
import { QualificacaoUnidadeComponent } from '../qualificacao-unidade/qualificacao-unidade.component';
import { PrioridadesProfeticasComponent } from '../prioridades-profeticas/prioridades-profeticas.component';
import { HomensAvancandoSacerdocioComponent } from '../homens-avancando-sacerdocio/homens-avancando-sacerdocio.component';
import { ReunioesAtividadesLancamentosComponent } from '../reunioes-atividades-lancamentos/reunioes-atividades-lancamentos.component';
import { JovensCriancasComponent } from '../jovens-criancas/jovens-criancas.component';

@Component({
  selector: 'app-pai',
  standalone: true,
  imports: [NgbAccordionModule, FrequenciaSacramentalComponent, RecemConversosComponent, SeminarioComponent, QualificacaoUnidadeComponent, PrioridadesProfeticasComponent, HomensAvancandoSacerdocioComponent, ReunioesAtividadesLancamentosComponent, JovensCriancasComponent],
  templateUrl: './pai.component.html',
  styleUrl: './pai.component.css'
})
export class PaiComponent {

}
