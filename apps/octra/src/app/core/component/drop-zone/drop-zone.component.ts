import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SessionFile} from '../../obj/SessionFile';

@Component({
  selector: 'octra-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.css']
})
export class DropZoneComponent implements OnInit {
  @Input()
  innerhtml = '';
  @Input() height = 'auto';
  public clicklocked = false;
  @Output() public afterdrop: EventEmitter<FileList> = new EventEmitter<FileList>();
  @ViewChild('fileinput', {static: true}) public fileinput: ElementRef;
  private fileAPIsupported = false;

  private _files: FileList = undefined;

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
      this._files = $event.dataTransfer.files;
      this.afterdrop.emit(this._files);
    }
  }

  onClick() {
    if (!this.clicklocked) {
      this.fileinput.nativeElement.click();
    }
  }

  onFileChange($event) {
    this._files = $event.target.files;
    this.afterdrop.emit(this._files);
  }
}
