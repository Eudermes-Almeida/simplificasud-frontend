import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomensAvancandoSacerdocioComponent } from './homens-avancando-sacerdocio.component';

describe('HomensAvancandoSacerdocioComponent', () => {
  let component: HomensAvancandoSacerdocioComponent;
  let fixture: ComponentFixture<HomensAvancandoSacerdocioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomensAvancandoSacerdocioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomensAvancandoSacerdocioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
