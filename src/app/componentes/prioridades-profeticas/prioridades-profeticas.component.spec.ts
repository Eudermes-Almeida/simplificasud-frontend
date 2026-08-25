import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrioridadesProfeticasComponent } from './prioridades-profeticas.component';

describe('PrioridadesProfeticasComponent', () => {
  let component: PrioridadesProfeticasComponent;
  let fixture: ComponentFixture<PrioridadesProfeticasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrioridadesProfeticasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrioridadesProfeticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
