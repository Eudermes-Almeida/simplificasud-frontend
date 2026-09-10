import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionariosNaAtivaComponent } from './missionarios-na-ativa.component';

describe('MissionariosNaAtivaComponent', () => {
  let component: MissionariosNaAtivaComponent;
  let fixture: ComponentFixture<MissionariosNaAtivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionariosNaAtivaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionariosNaAtivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
