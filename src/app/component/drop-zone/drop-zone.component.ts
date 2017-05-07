import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SessionFile} from '../../shared/SessionFile';

declare var window: any;

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.css']
})
export class DropZoneComponent implements OnInit {
  get file(): File {
    return this._file;
  }

  get sessionfile(): SessionFile {
    return this._sessionfile;
  }

  @Input()
  innerhtml = '';

  @Input() height = 'auto';

  private _file: File;
  private _sessionfile: SessionFile;
  private fileAPIsupported = false;

  @Output()
  public afterdrop: EventEmitter<File> = new EventEmitter<File>();

  @ViewChild('fileinput') fileinput: ElementRef;

  constructor() {
  }

  ngOnInit() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      this.fileAPIsupported = true;
    }
  }

  onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
    $event.dataTransfer.dropEffect = 'copy';
  }

  onFileDrop($event) {
    $event.stopPropagation();
    $event.preventDefault();

    if (this.fileAPIsupported) {
      const files = $event.dataTransfer.files; // FileList object.

      if (files.length === 1) {
        // select the first file
        this._file = files[0];
        console.log(this._file);
        this.afterdrop.emit(this._file);
      }
    }
  }

  onClick($event) {
    this.fileinput.nativeElement.click();
  }

  onFileChange($event) {
    const files = $event.target.files;

    if (files.length === 1) {
      // select the first file
      this._file = files[0];
      console.log(this._file);
      this.afterdrop.emit(this._file);
    }
  }
}
