import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialpadComponent } from './dialpad.component';

describe('DialpadComponent', () => {
  let component: DialpadComponent;
  let fixture: ComponentFixture<DialpadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialpadComponent]
    });
    fixture = TestBed.createComponent(DialpadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
