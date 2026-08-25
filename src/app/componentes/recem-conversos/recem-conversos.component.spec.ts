import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecemConversosComponent } from './recem-conversos.component';

describe('RecemConversosComponent', () => {
  let component: RecemConversosComponent;
  let fixture: ComponentFixture<RecemConversosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecemConversosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecemConversosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
