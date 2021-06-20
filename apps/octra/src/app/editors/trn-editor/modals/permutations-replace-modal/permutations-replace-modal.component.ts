import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {TranscriptionService} from '../../../../core/shared/service';
import {MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-permutations-replace',
  templateUrl: './permutations-replace-modal.component.html',
  styleUrls: ['./permutations-replace-modal.component.css']
})
export class PermutationsReplaceModalComponent implements OnDestroy {
  modalRef: MdbModalRef<PermutationsReplaceModalComponent>;
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = undefined;
  private actionperformed: Subject<string> = new Subject<string>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  listOfSpeakers: {
    name: string;
    replaceWith: string;
  }[] = [];

  constructor(private transcrService: TranscriptionService) {
  }

  private readListOfSpeakers() {
    const result = [];
    for (const segment of this.transcrService.currentlevel.segments.segments) {
      if (result.findIndex(a => a.name === segment.speakerLabel) < 0) {
        result.push({
          name: segment.speakerLabel,
          replaceWith: segment.speakerLabel
        });
      }
    }
    result.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      }

      return 0;
    });
    this.listOfSpeakers = result;
  }

  public open(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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
    return this.listOfSpeakers.filter(a => a.name !== exceptSpeaker);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.visible = false;
    this.subscrmanager.destroy();
  }

  setReplacement(i: number, replacement: string) {
    this.listOfSpeakers[i].replaceWith = replacement;
  }

  replaceSpeakers() {
    for (const segment of this.transcrService.currentlevel.segments.segments) {
      for (const speakerObj of this.listOfSpeakers) {
        if (segment.speakerLabel === speakerObj.name) {
          segment.speakerLabel = speakerObj.replaceWith;
          break;
        }
      }
    }

    // trigger saving
    this.transcrService.currentLevelSegmentChange.emit(undefined);
    this.modal.hide();
    this.actionperformed.next('replaced');
  }
}
