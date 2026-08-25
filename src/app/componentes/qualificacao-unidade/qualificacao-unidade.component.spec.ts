import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualificacaoUnidadeComponent } from './qualificacao-unidade.component';

describe('QualificacaoUnidadeComponent', () => {
  let component: QualificacaoUnidadeComponent;
  let fixture: ComponentFixture<QualificacaoUnidadeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualificacaoUnidadeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QualificacaoUnidadeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
