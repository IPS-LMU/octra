import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {isNullOrUndefined} from '../../shared/Functions';
import {Subject} from 'rxjs';
import {DragulaService} from 'ng2-dragula';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {Segment} from '../../../media-components/obj/annotation';

@Component({
  selector: 'app-naming-drag-and-drop',
  templateUrl: './naming-drag-and-drop.component.html',
  styleUrls: ['./naming-drag-and-drop.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NamingDragAndDropComponent implements OnInit, AfterViewInit, OnDestroy {

  public namingConventionArray = [
    'text',
    '<name>',
    '<sequNumber>',
    '<sampleStart>',
    '<sampleDur>',
    '<secondsStart>',
    '<secondsDur>'
  ];

  @ViewChild('list', {static: true}) list: ElementRef;
  @Input() fileName = '';
  @Input() firstSegment: Segment;

  @Output() namingConventionchanged: Subject<string> = new Subject<string>();
  public clicked = -1;

  private subcrManager = new SubscriptionManager();

  public get preview(): string {
    let result = '';
    if (!isNullOrUndefined(this.firstSegment)) {
      for (let i = 0; i < this.resultConvention.length; i++) {
        const item = this.resultConvention[i];
        if (item.type === 'text') {
          result += item.value;
        } else if (item.type === 'placeholder') {
          switch (item.value) {
            case('<name>'):
              result += (this.fileName.lastIndexOf('.') > -1) ? this.fileName.substring(0, this.fileName.lastIndexOf('.')) : this.fileName;
              break;
            case('<sequNumber>'):
              result += '0001';
              break;
            case('<sampleStart>'):
              result += '0';
              break;
            case('<sampleDur>'):
              result += this.firstSegment.time.samples.toString();
              break;
            case('<secondsStart>'):
              result += '0';
              break;
            case('<secondsDur>'):
              result += (Math.round((this.firstSegment.time.seconds * 10000)) / 10000)
                .toString().replace('.', ',');
              break;
          }
        }
      }
      result += '.wav';
    }

    return result;
  }

  public resultConvention = [
    {
      type: 'placeholder',
      value: '<name>'
    },
    {
      type: 'text',
      value: '_'
    },
    {
      type: 'placeholder',
      value: '<sequNumber>'
    }
  ];


  constructor(private dragulaService: DragulaService, private cd: ChangeDetectorRef) {
    this.dragulaService.createGroup('namingDragDrop', {
      direction: 'horizontal',
      revertOnSpill: true,
      removeOnSpill: false
    });

    this.subcrManager.add(this.dragulaService.dragend('namingDragDrop').subscribe(() => {
        this.cd.detectChanges();
      },
      (error) => {
      },
      () => {
      }));
  }

  ngOnInit() {
  }

  remove(i: number) {
    if (i < this.resultConvention.length - 1) {
      this.resultConvention.splice(i, 1);
      this.namingConventionchanged.next(this.namingConvention);
    }
    this.clicked = -1;
  }

  addItem(item: string) {
    if (item === 'text') {
      this.resultConvention.push({
        type: 'text',
        value: 'text'
      });
    } else {
      this.resultConvention.push({
        type: 'placeholder',
        value: item
      });
    }
    this.namingConventionchanged.next(this.namingConvention);
  }

  ngAfterViewInit() {
  }

  onItemClick(event, i) {
    if (this.resultConvention[i].type === 'text') {
      this.clicked = i;
    } else {
      this.clicked = -1;
    }
  }

  private deselect() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  }

  public get namingConvention(): string {
    let result = '';

    for (let i = 0; i < this.resultConvention.length; i++) {
      result += this.resultConvention[i].value;
    }
    return result;
  }

  onKeyDown($event, text) {
    if ($event.code === 'Enter') {
      $event.preventDefault();
      this.deselect();
      this.resultConvention[this.clicked].value = text.innerText;
      this.clicked = -1;
    }
  }

  ngOnDestroy(): void {
    this.subcrManager.destroy();
  }
}
