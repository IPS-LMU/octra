import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SessionFile} from '../../obj/SessionFile';

declare var window: any;

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.css']
})
export class DropZoneComponent implements OnInit {
  @Input()
  innerhtml = '';
  @Input() height = 'auto';
  public clicklocked = false;
  @Output()
  public afterdrop: EventEmitter<FileList> = new EventEmitter<FileList>();
  @ViewChild('fileinput') fileinput: ElementRef;
  private fileAPIsupported = false;

  constructor() {
  }

  private _files: FileList = null;
  private old_files: FileList = null;

  get files(): FileList {
    return this._files;
  }

  private _sessionfile: SessionFile;

  get sessionfile(): SessionFile {
    return this._sessionfile;
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
      this._files = files;
      this.afterdrop.emit(this._files);
    }
  }

  onClick($event) {
    if (!this.clicklocked) {
      this.fileinput.nativeElement.click();

      if ($event.target.files === this._files) {
        this.afterdrop.emit(this._files);
      }
    }
  }

  onFileChange($event) {
    const files: FileList = $event.target.files;
    this._files = files;
    this.afterdrop.emit(this._files);
  }
}
