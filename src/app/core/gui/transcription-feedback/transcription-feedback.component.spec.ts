import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TranscriptionFeedbackComponent} from './transcription-feedback.component';

describe('TranscriptionFeedbackComponent', () => {
  let component: TranscriptionFeedbackComponent;
  let fixture: ComponentFixture<TranscriptionFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TranscriptionFeedbackComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranscriptionFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
