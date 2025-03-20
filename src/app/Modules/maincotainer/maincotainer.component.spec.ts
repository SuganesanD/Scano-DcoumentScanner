import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaincotainerComponent } from './maincotainer.component';

describe('MaincotainerComponent', () => {
  let component: MaincotainerComponent;
  let fixture: ComponentFixture<MaincotainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaincotainerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaincotainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
