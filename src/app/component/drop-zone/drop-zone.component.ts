import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Logger } from "../../shared/Logger";
import { SessionFile } from "../../shared/SessionFile";
import { FileSize, Functions } from "../../shared/Functions";

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
  set sessionfile(value: SessionFile) {
    this._sessionfile = value;
  }

  private _file:File;
  private _sessionfile:SessionFile;

  @Output()
  public afterdrop:EventEmitter<File> = new EventEmitter<File>();
  constructor() { }

  ngOnInit() {
  }

  onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
    Logger.log("Drag");
    $event.dataTransfer.dropEffect = 'copy';
  }

  onFileDrop($event) {
    Logger.log("&Drop");
    $event.stopPropagation();
    $event.preventDefault();

    let files = $event.dataTransfer.files; // FileList object.

    if (files.length < 1) {
      alert("Etwas ist schiefgelaufen!");
    }
    else {
      //select the first file
      this._file = files[ 0 ];
      this.afterdrop.emit(this._file);
    }
  }

  getDropzoneFileString() {
    let fsize: FileSize = Functions.getFileSize(this.file.size);
    return Functions.buildStr("{0} ({1} {2})", [ this.file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
  }
}
