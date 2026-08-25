import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequenciaSacramentalComponent } from './frequencia-sacramental.component';

describe('FrequenciaSacramentalComponent', () => {
  let component: FrequenciaSacramentalComponent;
  let fixture: ComponentFixture<FrequenciaSacramentalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrequenciaSacramentalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FrequenciaSacramentalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
