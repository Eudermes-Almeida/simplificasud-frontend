import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReunioesAtividadesLancamentosComponent } from './reunioes-atividades-lancamentos.component';

describe('ReunioesAtividadesLancamentosComponent', () => {
  let component: ReunioesAtividadesLancamentosComponent;
  let fixture: ComponentFixture<ReunioesAtividadesLancamentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReunioesAtividadesLancamentosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReunioesAtividadesLancamentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
