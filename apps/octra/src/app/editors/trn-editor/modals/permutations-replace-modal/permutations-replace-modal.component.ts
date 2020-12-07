import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {TranscriptionService} from '../../../../core/shared/service';

@Component({
  selector: 'octra-permutations-replace',
  templateUrl: './permutations-replace-modal.component.html',
  styleUrls: ['./permutations-replace-modal.component.css']
})
export class PermutationsReplaceModalComponent implements OnInit, OnDestroy, AfterViewInit {
  modalRef: BsModalRef;
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  listOfSpeakers: string[] = [];

  constructor(private transcrService: TranscriptionService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  private readListOfSpeakers() {
    const result = [];
    for (const segment of this.transcrService.currentlevel.segments.segments) {
      if (result.findIndex(a => a === segment.speakerLabel) < 0) {
        result.push(segment.speakerLabel);
      }
    }
    result.sort();
    this.listOfSpeakers = result;
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.beforeModalOpened();
      this.modal.show(this.modal);
      this.visible = true;

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

    });
  }

  public close() {
    this.modal.hide();

    this.actionperformed.next();
  }

  private beforeModalOpened() {
    this.readListOfSpeakers();
  }

  getSpeakerListWithout(exceptSpeaker: string) {
    return this.listOfSpeakers.filter(a => a !== exceptSpeaker);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.visible = false;
    this.subscrmanager.destroy();
  }
}
