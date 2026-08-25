import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JovensCriancasComponent } from './jovens-criancas.component';

describe('JovensCriancasComponent', () => {
  let component: JovensCriancasComponent;
  let fixture: ComponentFixture<JovensCriancasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JovensCriancasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JovensCriancasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
