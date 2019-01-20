import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-naming-drag-and-drop',
  templateUrl: './naming-drag-and-drop.component.html',
  styleUrls: ['./naming-drag-and-drop.component.css']
})
export class NamingDragAndDropComponent implements OnInit, AfterViewInit {

  public namingConventionArray = [
    'text',
    '<name>',
    '<sequNumber>',
    '<sampleStart>',
    '<sampleDur>',
    '<secondsStart>',
    '<secondsDur>'
  ];

  public get preview(): string {
    let result = '';
    for (let i = 0; i < this.resultConvention.length; i++) {
      const item = this.resultConvention[i];
      if (item.type === 'text') {
        result += item.value;
      } else if (item.type === 'placeholder') {
        switch (item.value) {
          case('<name>'):
            result += 'TestAudioFile';
            break;
          case('<sequNumber>'):
            result += '01';
            break;
          case('<sampleStart>'):
            result += '324123';
            break;
          case('<sampleDur>'):
            result += '231423';
            break;
          case('<secondsStart>'):
            result += '12.123123123';
            break;
          case('<secondsDur>'):
            result += '12.21312312';
            break;
        }
      } else if (item.type === 'extension') {
        result += item.value;
      }
    }

    return result;
  }

  public resultConvention = [
    {
      type: 'text',
      value: 'TestName_'
    },
    {
      type: 'placeholder',
      value: '<name>'
    },
    {
      type: 'extension',
      value: '.wav'
    }
  ];


  constructor() {
  }

  ngOnInit() {
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex < this.resultConvention.length - 1) {
      moveItemInArray(this.resultConvention, event.previousIndex, event.currentIndex);
    }
  }

  remove(i: number) {
    if (i < this.resultConvention.length - 1) {
      this.resultConvention.splice(i, 1);
    }
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
    this.sortItems();
  }

  ngAfterViewInit() {
  }

  sortItems() {
    this.resultConvention = this.resultConvention.sort((a, b) => {
      if (a.type !== 'extension' && b.type !== 'extension') {
        return 0;
      } else if (a.type === 'extension' && b.type !== 'extension') {
        return 1;
      } else if (a.type !== 'extension' && b.type === 'extension') {
        return -1;
      }
      return 0;
    });
  }

  onTextKeyUp($event) {
    console.log(`keyup`);
  }

  onItemClick(event) {
    if (event.target !== document.activeElement) {
      event.target.focus();
      console.log('FOCUS!');
    }
  }

  onDragEnd(event) {
    console.log(`drag ended!`);
  }
}
