import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbDropdownItem, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { OctraAnnotationSegment, OEvent, OItem } from '@octra/annotation';
import { Subject } from 'rxjs';
import { DefaultComponent } from '../../component/default.component';

@Component({
  selector: 'octra-naming-drag-and-drop',
  templateUrl: './naming-drag-and-drop.component.html',
  styleUrls: ['./naming-drag-and-drop.component.scss'],
  imports: [
    NgbDropdownModule,
    TranslocoPipe,
    NgbDropdownItem,
    CdkDropList,
    NgClass,
    CdkDrag,
  ],
})
export class NamingDragAndDropComponent extends DefaultComponent {
  public namingConventionArray = [
    'text',
    '<name>',
    '<sequNumber>',
    '<sampleStart>',
    '<sampleDur>',
    '<secondsStart>',
    '<secondsDur>',
  ];

  @ViewChild('list', { static: true }) list!: ElementRef;
  @Input() fileName = '';
  @Input() firstSegment?: OEvent | OItem | OctraAnnotationSegment;

  @Output() namingConventionchanged: Subject<string> = new Subject<string>();

  public clicked = -1;
  public resultConvention = [
    {
      type: 'placeholder',
      value: '<name>',
    },
    {
      type: 'text',
      value: '_',
    },
    {
      type: 'placeholder',
      value: '<sequNumber>',
    },
  ];

  public get preview(): string {
    let result = '';
    if (
      this.firstSegment !== undefined &&
      this.firstSegment instanceof OctraAnnotationSegment
    ) {
      for (const resultConvention of this.resultConvention) {
        const item = resultConvention;
        if (item.type === 'text') {
          result += item.value;
        } else if (item.type === 'placeholder') {
          switch (item.value) {
            case '<name>':
              result +=
                this.fileName.lastIndexOf('.') > -1
                  ? this.fileName.substring(0, this.fileName.lastIndexOf('.'))
                  : this.fileName;
              break;
            case '<sequNumber>':
              result += '0001';
              break;
            case '<sampleStart>':
              result += '0';
              break;
            case '<sampleDur>':
              result += this.firstSegment.time.samples.toString();
              break;
            case '<secondsStart>':
              result += '0';
              break;
            case '<secondsDur>':
              result += (
                Math.round(this.firstSegment.time.seconds * 10000) / 10000
              )
                .toString()
                .replace('.', ',');
              break;
          }
        }
      }
      result += '.wav';
    }

    return result;
  }

  public get namingConvention(): string {
    let result = '';

    for (const resultConventionElement of this.resultConvention) {
      result += resultConventionElement.value;
    }

    return result;
  }

  constructor(private cd: ChangeDetectorRef) {
    super();
  }

  remove(i: number) {
    if (i < this.resultConvention.length) {
      this.resultConvention.splice(i, 1);
      this.namingConventionchanged.next(this.namingConvention);
    }
    this.clicked = -1;
  }

  addItem(item: string) {
    if (item === 'text') {
      this.resultConvention.push({
        type: 'text',
        value: 'text',
      });
    } else {
      this.resultConvention.push({
        type: 'placeholder',
        value: item,
      });
    }
    this.namingConventionchanged.next(this.namingConvention);
  }

  onItemClick(event: MouseEvent, i: number) {
    if (this.resultConvention[i].type === 'text') {
      this.clicked = i;
    } else {
      this.clicked = -1;
    }
  }

  onKeyDown($event: any, text: HTMLElement) {
    if ($event.code === 'Enter') {
      $event.preventDefault();
      $event.stopPropagation();
      this.deselect();
      this.resultConvention[this.clicked].value = text.innerText;
      this.clicked = -1;
    }
  }

  private deselect() {
    if (window.getSelection) {
      if (window.getSelection()?.empty) {
        // Chrome
        window.getSelection()!.empty();
      } else if (window.getSelection()?.removeAllRanges) {
        // Firefox
        window.getSelection()!.removeAllRanges();
      }
    }
  }

  onDrop($event: any) {
    moveItemInArray(
      this.resultConvention,
      $event.previousIndex,
      $event.currentIndex
    );
  }
}
