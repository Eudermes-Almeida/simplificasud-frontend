import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionariosRetornadosComponent } from './missionarios-retornados.component';

describe('MissionariosRetornadosComponent', () => {
  let component: MissionariosRetornadosComponent;
  let fixture: ComponentFixture<MissionariosRetornadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionariosRetornadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionariosRetornadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
