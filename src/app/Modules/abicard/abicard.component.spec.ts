import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbicardComponent } from './abicard.component';

describe('AbicardComponent', () => {
  let component: AbicardComponent;
  let fixture: ComponentFixture<AbicardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbicardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AbicardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
