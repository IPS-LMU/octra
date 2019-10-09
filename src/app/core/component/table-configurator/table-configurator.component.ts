import {Component, Input, OnInit} from '@angular/core';
import {Annotation, Level} from '../../obj/Annotation';

export interface ColumnDefinition {
  type: string;
  formats: ColumnFormat[];
}

export interface ColumnFormat {
  name: string;
  defaultValue: string;
  formatString: string;
  formatFunction: (level: Level, segmentNumber: number, counter: number) => string;
}

@Component({
  selector: 'app-table-configurator',
  templateUrl: './table-configurator.component.html',
  styleUrls: ['./table-configurator.component.css'],
  providers: []
})
export class TableConfiguratorComponent implements OnInit {

  @Input() columns: {
    title: string,
    columnDefinition: {
      type: string,
      selectedFormat: ColumnFormat,
      formats: ColumnFormat[]
    }
  }[] = [];
  @Input() annotation: Annotation;
  @Input() options = {};
  @Input() currentLevelID;

  private columnDefinitions: ColumnDefinition[] = [{
    type: 'segmentStart',
    formats: [{
      name: 'Timestamp',
      defaultValue: '01:30:02.234',
      formatString: 'HH:mm:ss.mss',
      formatFunction: (level: Level, segmentNumber: number, counter: number) => {
        // the value must be a unix timestamp
        let segmentStart = (segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.originalSample.seconds * 1000 : 0;
        segmentStart = Math.round(segmentStart);

        return this.convertMilliSecondsIntoLegibleString(segmentStart);
      }
    },
      {
        name: 'Samples',
        defaultValue: '120345',
        formatString: '120345',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return ((segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.originalSample.value : 0) + '';
        }
      }]
  },
    {
      type: 'segmentEnd',
      formats: [{
        name: 'Timestamp',
        defaultValue: '01:30:02.234',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          const segment = level.segments.get(segmentNumber);
          return this.convertMilliSecondsIntoLegibleString(Math.round(segment.time.originalSample.seconds * 1000));
        },
        formatString: 'HH:mm:ss.mss'
      },
        {
          name: 'Samples',
          formatString: '120345',
          defaultValue: '120345',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            return ((segmentNumber > 0) ? level.segments.get(segmentNumber).time.originalSample.value : 0) + '';
          }
        }]
    },
    {
      type: 'lineNumber',
      formats: [{
        name: 'short',
        defaultValue: '1',
        formatString: '1',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return `${counter}`;
        }
      }]
    },
    {
      type: 'sampleRate',
      formats: [{
        name: 'full',
        defaultValue: '44100',
        formatString: '44100',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return `${level.segments.get(0).time.originalSample.sampleRate}`;
        }
      },
        {
          name: 'short',
          defaultValue: '44,1kHz',
          formatString: '44,1kHz',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            return `${level.segments.get(0).time.originalSample.sampleRate / 1000}kHz`;
          }
        }]
    },
    {
      type: 'transcript',
      formats: [{
        name: 'raw text',
        defaultValue: 'Some transcript...',
        formatString: '',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return level.segments.get(segmentNumber).transcript;
        }
      }]
    }, {
      type: 'tier',
      formats: [{
        name: 'tier name',
        defaultValue: 'OCTRA_1',
        formatString: '',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return level.name;
        }
      }]
    }
  ];

  constructor() {
  }

  ngOnInit() {
  }

  tableConfiguratorAddColumn() {
    const formats = this.getColumnDefinitionByType('segmentStart').formats;

    this.columns.push({
      title: 'segmentStart',
      columnDefinition: {
        type: 'segmentStart',
        selectedFormat: formats[0],
        formats: formats
      }
    });
  }

  convertMilliSecondsIntoLegibleString(milliSecondsIn) {
    const secsIn = milliSecondsIn / 1000;
    let milliSecs: any = milliSecondsIn % 1000;

    let hours: any = Math.floor(secsIn / 3600),
      remainder: any = Math.floor(secsIn % 3600),
      minutes: any = Math.floor(remainder / 60),
      seconds: any = Math.floor(remainder % 60);

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    milliSecs = (milliSecs < 10) ? '0' + milliSecs : milliSecs;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    return (hours + ':'
      + minutes + ':'
      + seconds + ':' + milliSecs);
  }

  getColumnDefinitionByType(type: string) {
    return this.columnDefinitions.find((a) => {
      return a.type === type;
    });
  }

  onTypeClick(columnIndex: number, colDef: ColumnDefinition) {
    const column = this.columns[columnIndex];
    this.updateTitle(column, colDef.type);

    column.columnDefinition = {
      type: colDef.type,
      selectedFormat: colDef.formats[0],
      formats: colDef.formats
    };
  }

  onFormatClick(columnIndex: number, format: ColumnFormat) {
    const column = this.columns[columnIndex];
    this.updateTitle(column, column.columnDefinition.type);
    console.log(`selected format ${format.name}`);

    const colDef = this.columns[columnIndex].columnDefinition;
    this.columns[columnIndex].columnDefinition = {
      type: colDef.type,
      selectedFormat: format,
      formats: colDef.formats
    };
  }

  updateTitle(column: any, newTitle: string) {
    let oldTitleIsType = false;
    let newTitleIsType = false;

    for (let i = 0; i < this.columnDefinitions.length; i++) {
      const definition = this.columnDefinitions[i];

      if (definition.type === column.title) {
        oldTitleIsType = true;
      }
      if (definition.type === newTitle) {
        newTitleIsType = true;
      }

      if (oldTitleIsType && newTitleIsType) {
        break;
      }
    }

    if (oldTitleIsType && newTitleIsType || (column.title === 'Title' || column.title === '')) {
      // change title
      column.title = newTitle;
    }
  }

  generateFile() {
    let header = '';
    let textLines: {
      text: string;
      samples: number
    }[] = [];

    // create header

    let hasTierColumn = false;
    for (let k = 0; k < this.columns.length; k++) {
      header += this.columns[k].title;
      if (k < this.columns.length - 1) {
        header += '\t';
      }
      if (this.columns[k].columnDefinition.type === 'tier') {
        hasTierColumn = true;
      }
    }
    header += '\n';

    let counter = 1;
    const levelNum = this.getLevelNumber();
    let startAt = (hasTierColumn) ? levelNum : 0;
    for (let i = startAt; i < this.annotation.levels.length; i++) {
      const level = this.annotation.levels[i];

      for (let j = 0; j < level.segments.length; j++) {
        const segment = level.segments.get(j);

        let text = '';

        for (let k = 0; k < this.columns.length; k++) {
          text += this.columns[k].columnDefinition.selectedFormat.formatFunction(level, j, counter);
          if (k < this.columns.length - 1) {
            text += '\t';
          }
        }

        textLines.push({
          text,
          samples: segment.time.originalSample.value
        });
        counter++;
      }

      if (hasTierColumn) {
        // stop after actual level
        break;
      }
    }

    let result = header;

    textLines = textLines.sort((a, b) => {
      if (a.samples === b.samples) {
        return 0;
      }
      return (a.samples < b.samples) ? -1 : 1;
    });

    for (let i = 0; i < textLines.length; i++) {
      result += `${textLines[i].text}\n`
    }
    result += '\n';

    console.log(result);

    const file = new File([result], 'test.csv');
    const url = URL.createObjectURL(file);
    console.log(url);
  }

  private getLevelNumber(): number {
    if (!this.currentLevelID !== undefined) {
      const result = (this.annotation.levels.findIndex((a) => {
        return a.id === this.currentLevelID;
      }));

      return (result !== undefined) ? result : 0;
    }

    return 0;
  }
}
