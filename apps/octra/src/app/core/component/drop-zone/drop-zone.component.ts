import { NgStyle } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { SessionFile } from '../../obj/SessionFile';

@Component({
  selector: 'octra-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.scss'],
  imports: [NgStyle],
})
export class DropZoneComponent implements OnInit {
  @Input()
  innerhtml = '';
  @Input() height = 'auto';
  public clicklocked = false;
  @Output() public afterdrop: EventEmitter<File[]> = new EventEmitter<File[]>();
  @ViewChild('fileinput', { static: true }) fileinput!: ElementRef;
  private fileAPIsupported = false;

  private _files?: File[];

  get files(): File[] | undefined {
    return this._files;
  }

  private _sessionfile?: SessionFile;

  get sessionfile(): SessionFile | undefined {
    return this._sessionfile;
  }

  ngOnInit() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      this.fileAPIsupported = true;
    }
  }

  onDragOver($event: DragEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    $event.dataTransfer.dropEffect = 'copy';
  }

  onFileDrop($event: DragEvent) {
    $event.stopPropagation();
    $event.preventDefault();

    if (this.fileAPIsupported) {
      this._files = this.filterFiles($event.dataTransfer.files);
      this.afterdrop.emit(Array.from(this._files));
    }
  }

  onClick() {
    if (!this.clicklocked) {
      this.fileinput.nativeElement.click();
    }
  }

  onFileChange($event: any) {
    this._files = this.filterFiles($event.target.files);
    this.afterdrop.emit(this._files);
  }

  private filterFiles(files: FileList): File[] {
    return Array.from(files).filter((a) => /.*zip.*/g.exec(a.type) === null);
  }
}
