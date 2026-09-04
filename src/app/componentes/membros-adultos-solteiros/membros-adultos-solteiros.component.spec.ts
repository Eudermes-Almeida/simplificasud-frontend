import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembrosAdultosSolteirosComponent } from './membros-adultos-solteiros.component';

describe('MembrosAdultosSolteirosComponent', () => {
  let component: MembrosAdultosSolteirosComponent;
  let fixture: ComponentFixture<MembrosAdultosSolteirosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembrosAdultosSolteirosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembrosAdultosSolteirosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
