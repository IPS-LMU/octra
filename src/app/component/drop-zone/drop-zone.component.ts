import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SessionFile} from '../../shared/SessionFile';

declare var window: any;

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.css']
})
export class DropZoneComponent implements OnInit {
  get files(): FileList {
    return this._files;
  }

  get sessionfile(): SessionFile {
    return this._sessionfile;
  }

  @Input()
  innerhtml = '';

  @Input() height = 'auto';

  private _files: FileList = null;
  private _sessionfile: SessionFile;
  private fileAPIsupported = false;

  @Output()
  public afterdrop: EventEmitter<FileList> = new EventEmitter<FileList>();

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
      const files: FileList = $event.dataTransfer.files; // FileList object.
            if (files.length <= 2) {
                // select the first file
        this._files = files;
                this.afterdrop.emit(this._files);
      }
    }
  }

  onClick($event) {
    this.fileinput.nativeElement.click();
  }

  onFileChange($event) {
    const files: FileList = $event.target.files;

    this._files = files;
    this.afterdrop.emit(this._files);
  }
}
