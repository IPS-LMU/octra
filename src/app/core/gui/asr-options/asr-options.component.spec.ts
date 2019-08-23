import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AsrOptionsComponent} from './asr-options.component';

describe('AsrOptionsComponent', () => {
  let component: AsrOptionsComponent;
  let fixture: ComponentFixture<AsrOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AsrOptionsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsrOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
