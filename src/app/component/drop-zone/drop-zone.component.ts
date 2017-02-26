import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SessionFile } from "../../shared/SessionFile";

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
  innerhtml:string = "";

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
    $event.dataTransfer.dropEffect = 'copy';
  }

  onFileDrop($event) {
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
}
