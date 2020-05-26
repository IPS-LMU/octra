import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Annotation, isUnset, Level} from 'octra-components';

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
  selector: 'octra-table-configurator',
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
      formats: ColumnFormat[],
      cells: {
        level: number,
        text: string,
        samples: number
      }[]
    }
  }[] = [];
  @Input() annotation: Annotation;
  @Input() options = {};
  @Input() currentLevelID;
  @Input() view: 'expert' | 'easy' = 'easy';
  @Input() tableWidth = 300;
  resultURL: SafeResourceUrl = null;

  includeLineNumbers = false;

  tableOptions = {
    addHeader: false,
    fileExtension: '.csv',
    divider: {
      name: 'Tabulator',
      value: '\\t'
    },
    selection: {
      dividers: [
        {
          name: 'Semikolon',
          value: ';'
        },
        {
          name: 'Komma',
          value: ','
        },
        {
          name: 'Tabulator',
          value: '\\t'
        }
      ],
      extension: [
        '.csv', '.txt', '.table', '.tsv'
      ]
    },
    timeFormat: 'Timestamp',
    timeFormats: [
      'Timestamp',
      'Seconds',
      'Samples'
    ]
  };

  private columnDefinitions: ColumnDefinition[] = [{
    type: 'segmentStart',
    formats: [{
      name: 'Timestamp',
      defaultValue: '01:30:02.234',
      formatString: 'HH:mm:ss.mss',
      formatFunction: (level: Level, segmentNumber: number, counter: number) => {
        // the value must be a unix timestamp
        let segmentStart = (segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.seconds * 1000 : 0;
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
          return ((segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.samples + 1 : 1) + '';
        }
      },
      {
        name: 'Seconds',
        formatString: '23.4567...',
        defaultValue: '23.4567',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return ((segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.seconds.toFixed(4) : '0') + '';
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
          return this.convertMilliSecondsIntoLegibleString(Math.round(segment.time.seconds * 1000));
        },
        formatString: 'HH:mm:ss.mss'
      },
        {
          name: 'Samples',
          formatString: '120345',
          defaultValue: '120345',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            return level.segments.get(segmentNumber).time.samples + '';
          }
        },
        {
          name: 'Seconds',
          formatString: '23.4567...',
          defaultValue: '23.4567',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            return level.segments.get(segmentNumber).time.seconds.toFixed(4) + '';
          }
        }]
    },
    {
      type: 'segmentDuration',
      formats: [
        {
          name: 'Timestamp',
          defaultValue: '01:30:02.234',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            const segmentStart = (segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.seconds : 0;
            const segment = level.segments.get(segmentNumber);
            return this.convertMilliSecondsIntoLegibleString(Math.round((segment.time.seconds - segmentStart) * 1000));
          },
          formatString: 'HH:mm:ss.mss'
        },
        {
          name: 'Samples',
          formatString: '120345',
          defaultValue: '120345',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            const segmentStart = (segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.samples + 1 : 1;
            return (level.segments.get(segmentNumber).time.samples - segmentStart) + '';
          }
        },
        {
          name: 'Seconds',
          formatString: '23.4567...',
          defaultValue: '23.4567',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            const segmentStart = (segmentNumber > 0) ? level.segments.get(segmentNumber - 1).time.seconds : 0;
            return (level.segments.get(segmentNumber).time.seconds - segmentStart).toFixed(4) + '';
          }
        }
      ]
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
    },
    {
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
    },
    {
      type: 'sampleRate',
      formats: [{
        name: 'full',
        defaultValue: '44100',
        formatString: '44100',
        formatFunction: (level: Level, segmentNumber: number, counter: number) => {
          // the value must be a unix timestamp
          return `${level.segments.get(0).time.sampleRate}`;
        }
      },
        {
          name: 'short',
          defaultValue: '44,1kHz',
          formatString: '44,1kHz',
          formatFunction: (level: Level, segmentNumber: number, counter: number) => {
            // the value must be a unix timestamp
            return `${level.segments.get(0).time.sampleRate / 1000}kHz`;
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
    }
  ];

  public get remainingColDefs(): ColumnDefinition[] {
    const remaining: ColumnDefinition[] = [];

    for (const colDef of this.columnDefinitions) {
      if (this.columns.find((a) => {
        return a.columnDefinition.type === colDef.type;
      }) === undefined && colDef.type !== 'lineNumber') {
        remaining.push(colDef);
      }
    }

    return remaining;
  }

  constructor(private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.tableConfiguratorAddColumn();
    this.tableConfiguratorAddColumn();
    this.tableConfiguratorAddColumn();
    this.tableConfiguratorAddColumn();
    this.tableConfiguratorAddColumn();
    this.tableConfiguratorAddColumn();
  }

  tableConfiguratorAddColumn(position = -1, type: string = '') {
    let colDef: ColumnDefinition;

    if (type === '') {
      colDef = this.findNextUnusedColumnDefinition();
    } else {
      colDef = this.columnDefinitions.find((a) => {
        return a.type === type;
      });
    }
    if (!isUnset(colDef)) {
      const item = {
        title: colDef.type,
        columnDefinition: {
          type: colDef.type,
          selectedFormat: colDef.formats[0],
          formats: colDef.formats,
          cells: []
        }
      };
      if (position < 0) {
        this.columns.push(item);
      } else {
        this.columns.splice(position, 0, item);
      }
      this.updateAllTableCells();
      this.onSomethingDone();
    }
  }

  convertMilliSecondsIntoLegibleString(milliSecondsIn) {
    const secsIn = milliSecondsIn / 1000;
    let milliSecs: any = milliSecondsIn % 1000;

    let hours: any = Math.floor(secsIn / 3600);
    const remainder: any = Math.floor(secsIn % 3600);
    let minutes: any = Math.floor(remainder / 60);
    let seconds: any = Math.floor(remainder % 60);

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    milliSecs = (milliSecs < 100) ? '0' + milliSecs : milliSecs;
    milliSecs = (milliSecs < 10) ? '0' + milliSecs : milliSecs;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    return (hours + ':'
      + minutes + ':'
      + seconds + '.' + milliSecs);
  }

  onFormatClick(format: string) {
    for (const column of this.columns) {
      if (
        column.columnDefinition.type === 'segmentStart' ||
        column.columnDefinition.type === 'segmentEnd' ||
        column.columnDefinition.type === 'segmentDuration'
      ) {
        this.updateTitle(column, column.columnDefinition.type);

        const selFormat = column.columnDefinition.formats.find((a) => {
          return a.name === format;
        });
        column.columnDefinition = {
          type: column.columnDefinition.type,
          selectedFormat: selFormat,
          formats: column.columnDefinition.formats,
          cells: column.columnDefinition.cells
        };
      }
    }
    this.updateAllTableCells();
    this.onSomethingDone();
  }

  updateTitle(column: any, newTitle: string) {
    let oldTitleIsType = false;
    let newTitleIsType = false;

    for (const columnDefinition of this.columnDefinitions) {
      if (columnDefinition.type === column.title) {
        oldTitleIsType = true;
      }
      if (columnDefinition.type === newTitle) {
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
    const textLines: {
      text: string;
      samples: number
    }[] = [];
    const divider = this.tableOptions.divider.value.replace('\\t', '\t');
    let colOfLineNum = -1;

    // create header
    let hasTierColumn = false;
    for (let k = 0; k < this.columns.length; k++) {
      header += this.columns[k].title;
      if (k < this.columns.length - 1) {
        header += divider;
      }
      if (this.columns[k].columnDefinition.type === 'tier') {
        hasTierColumn = true;
      }
      if (this.columns[k].columnDefinition.type === 'lineNumber') {
        colOfLineNum = k;
      }
    }
    header += '\n';

    let counter = 0;
    const levelNum = this.getLevelNumber();
    const startAt = (hasTierColumn) ? 0 : levelNum;
    for (let i = startAt; i < this.annotation.levels.length; i++) {
      const level = this.annotation.levels[i];

      for (let j = 0; j < level.segments.length; j++) {
        const segment = level.segments.get(j);

        let text = '';

        for (let k = 0; k < this.columns.length; k++) {
          text += this.columns[k].columnDefinition.cells[counter].text;
          if (k < this.columns.length - 1) {
            text += divider;
          }
        }

        textLines.push({
          text,
          samples: segment.time.samples
        });
        counter++;
      }

      if (!hasTierColumn) {
        // stop after actual level
        break;
      }
    }

    let result = (this.tableOptions.addHeader) ? header : '';

    for (const textLine of textLines) {
      result += `${textLine.text}\n`;
    }
    result += '\n';

    const file = new File([result], 'test' + this.tableOptions.fileExtension);
    this.resultURL = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
  }

  onExtensionClick(extension) {
    this.tableOptions.fileExtension = extension;
    this.onSomethingDone();
  }

  onDividerClick(dividerValue: string) {
    this.tableOptions.divider = this.tableOptions.selection.dividers.find((a) => {
      return a.value === dividerValue;
    });
    this.onSomethingDone();
  }

  findNextUnusedColumnDefinition(): ColumnDefinition {
    for (const columnDefinition of this.columnDefinitions) {
      const alreadyUsed = this.columns.findIndex((a) => {
        return a.columnDefinition.type === columnDefinition.type;
      }) > -1;

      if (!alreadyUsed) {
        return columnDefinition;
      }
    }

    return null;
  }

  onSomethingDone() {
    this.resultURL = null;
  }

  onDeleteColumnClick(columnNumber: number) {
    if (columnNumber < this.columns.length) {
      this.columns.splice(columnNumber, 1);
    }
  }

  updateTableCells(index: number) {
    const def = this.columns[index].columnDefinition.selectedFormat;
    let hasTierColumn = false;
    for (const column of this.columns) {
      if (column.columnDefinition.type === 'tier') {
        hasTierColumn = true;
        break;
      }
    }

    let counter = 1;
    const levelNum = this.getLevelNumber();
    const startAt = (hasTierColumn) ? 0 : levelNum;
    this.columns[index].columnDefinition.cells = [];

    for (let i = startAt; i < this.annotation.levels.length; i++) {
      const level = this.annotation.levels[i];
      let start = 0;

      for (let j = 0; j < level.segments.length; j++) {
        const segment = level.segments.get(j);
        const text = def.formatFunction(level, j, counter);

        this.columns[index].columnDefinition.cells.push({
          level: i,
          text,
          samples: start
        });
        counter++;
        start = segment.time.samples;
      }

      if (!hasTierColumn) {
        // stop after actual level
        break;
      }
    }

    if (this.columns[index].columnDefinition.type !== 'lineNumber') {
      this.columns[index].columnDefinition.cells = this.columns[index].columnDefinition.cells.sort(
        (a, b) => {
          if (a.samples === b.samples) {
            if (a.level > b.level) {
              return 1;
            } else if (a.level < b.level) {
              return -1;
            }
            return 0;
          } else if (a.samples > b.samples) {
            return 1;
          } else if (a.samples < b.samples) {
            return -1;
          }
        }
      );
    }

  }

  onDragulaModelChange(event) {
    this.updateAllTableCells();
  }

  onTitleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      event.preventDefault();
    }
  }

  onTitleKeyUp(event: KeyboardEvent, title: HTMLDivElement, colIndex: number) {
    if (event.code === 'Enter') {
      this.columns[colIndex].title = title.innerText;
      this.onSomethingDone();
    }
  }

  onTitleLeave(title: HTMLDivElement, colIndex: number) {
    this.columns[colIndex].title = title.innerText;
    this.onSomethingDone();
  }

  public updateAllTableCells() {
    for (let i = 0; i < this.columns.length; i++) {
      this.updateTableCells(i);
    }
  }

  onCheckboxChange() {
    if (this.includeLineNumbers) {
      this.tableConfiguratorAddColumn(0, 'lineNumber');
    } else {
      this.removeColumn('lineNumber');
      this.updateAllTableCells();
      this.onSomethingDone();
    }
  }

  public onTimeFormatChange(format: string) {
    this.tableOptions.timeFormat = format;
    this.onFormatClick(format);
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

  private removeColumn(type: string) {
    const index = this.columns.findIndex((a) => {
      return a.columnDefinition.type === type;
    });

    if (index > -1) {
      this.columns.splice(index, 1);
    }
  }
}
