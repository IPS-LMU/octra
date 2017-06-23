import {Component, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile} from '../../obj/annotjson';
import {AudioInfo} from '../../obj/AudioInfo';
import {FileSize, Functions} from '../../shared/Functions';
import {AppInfo} from '../../../app.info';
import {isNullOrUndefined} from 'util';
import {Converter} from '../../obj/Converters/Converter';
import {DropZoneComponent} from '../../component/drop-zone/drop-zone.component';
import {SessionFile} from '../../obj/SessionFile';
import {ModalService} from '../../shared/service/modal.service';

@Component({
  selector: 'app-octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.css']
})
export class OctraDropzoneComponent implements OnInit {
  get status(): string {
    return this._status;
  }

  get oannotation(): OAnnotJSON {
    return this._oannotation;
  }

  get oaudiofile(): OAudiofile {
    return this._oaudiofile;
  }

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  @ViewChild('dropzone') dropzone: DropZoneComponent;

  public _files: {
    status: string,
    file: File,
    checked_converters: number
  }[] = [];

  private _oaudiofile: OAudiofile;
  private _oannotation: OAnnotJSON;
  private _status: string;

  public get files(): {
    status: string,
    file: File,
    checked_converters: number
  }[] {
    return this._files;
  }

  constructor(private modService: ModalService) {

  }

  ngOnInit() {
  }

  public isValidImportData(file: { status: string, file: File, checked_converters: number }) {
    if (!isNullOrUndefined(this._oaudiofile)) {
      for (let i = 0; i < AppInfo.converters.length; i++) {
        const converter: Converter = AppInfo.converters[i];
        if (Functions.contains(file.file.name, AppInfo.converters[i].extension)) {
          if (converter.conversion.import) {

            const reader: FileReader = new FileReader();

            reader.onloadend = () => {
              if (file.status === 'progress') {
                const ofile = {
                  name: file.file.name,
                  content: reader.result,
                  type: file.file.type,
                  encoding: converter.encoding
                };

                const test: OAnnotJSON = converter.import(ofile, this._oaudiofile);
                file.checked_converters++;
                if (!isNullOrUndefined(test)) {
                  file.status = 'valid';
                  this._oannotation = test;
                  this.checkState();
                } else if (file.checked_converters === AppInfo.converters.length) {
                  // last converter to check
                  file.status = 'invalid';
                  this._oannotation = null;
                  this.checkState();
                }
              }
            };

            reader.readAsText(file.file, converter.encoding.toLowerCase());
          } else {
            file.checked_converters++;
          }
        } else {
          file.checked_converters++;
        }
      }
      if (file.checked_converters === AppInfo.converters.length
        && file.status === 'progress'
      ) {
        file.status = 'invalid';
      }
    } else {
      file.status = 'invalid';
    }
  }

  public afterDrop() {
    this._oannotation = null;
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const file = {
        status: 'progress',
        file: this.dropzone.files[i],
        checked_converters: 0
      };

      let data_file = null;
      let audio_file = null;
      for (let j = 0; j < this.files.length; j++) {
        const file_any = this.files[j];

        if (Functions.contains(file_any.file.name, '.wav')) {
          audio_file = file_any;
        } else if (file_any.file.name === file.file.name) {
          data_file = file_any;
        }
      }

      if (Functions.contains(file.file.name, '.wav')) {
        file.status = 'progress';
        const reader = new FileReader();

        reader.onloadend = () => {

          // check audio
          const info: AudioInfo = new AudioInfo(reader.result);
          info.decodeAudio(reader.result).then(() => {
            file.status = 'valid';
            this._oaudiofile = new OAudiofile();
            this._oaudiofile.name = file.file.name;
            this._oaudiofile.size = file.file.size;
            this._oaudiofile.duration = info.duration;
            this._oaudiofile.samplerate = info.samplerate;
            this.checkState();

            // load import data
            for (let j = 0; j < this.dropzone.files.length; j++) {
              const importfile = this.dropzone.files[j];
              if (!Functions.contains(importfile.name, '.wav')) {
                this.dropFile(importfile.name);

                const newfile = {
                  status: 'progress',
                  file: this.dropzone.files[j],
                  checked_converters: 0
                };
                this.dropFile('.wav', true, true);
                this._files.push(newfile);
                this.isValidImportData(newfile);
              }
            }

            // check for data already exist
            for (let j = 0; j < this.files.length; j++) {
              const importfile = this.files[j].file;
              if (!Functions.contains(importfile.name, '.wav')) {
                this.files[j].status = 'progress';
                this.files[j].checked_converters = 0;
                this.isValidImportData(this.files[j]);
                break;
              }
            }
          }).catch(
            (err) => {
              alert(err);
            }
          );
        };

        reader.readAsArrayBuffer(file.file);
        this.dropFile('.wav', true);
        this._files.push(file);
        break;
      } else if (!isNullOrUndefined(audio_file)) {
        // load import data
        for (let j = 0; j < this.dropzone.files.length; j++) {
          const importfile = this.dropzone.files[j];
          if (!Functions.contains(importfile.name, '.wav')) {
            this.dropFile('.wav', true, true);

            const newfile = {
              status: 'progress',
              file: this.dropzone.files[j],
              checked_converters: 0
            };
            this._files.push(newfile);
            this.isValidImportData(newfile);
          }
        }
      }
    }
  }

  private checkState() {
    if (isNullOrUndefined(this._files)) {
      this._status = 'empty';
    } else {
      if (!isNullOrUndefined(this.oaudiofile)) {
        if (this.files.length > 0) {
          for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].status === 'progress'
              || this.files[i].status === 'invalid') {
              this._status = this.files[i].status;
              break;
            }
            this._status = 'valid';
          }
        } else {
          this._status = 'valid';
        }
      } else {
        this._status = 'invalid';
      }
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  showSupported() {
    this.modService.show('supportedfiles');
  }

  private dropFile(filename: string, contains: boolean = false, containsnot: boolean = false): boolean {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i].file;

      if ((!contains && filename === file.name)) {
        if (Functions.contains(file.name, filename)) {
          this.files.splice(i, 1);
          return true;
        }
      } else if (contains) {
        if (!containsnot) {
          if (Functions.contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        } else {
          if (!Functions.contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        }
      }
    }
    return false;
  }

  onDeleteEntry(entry: string) {
    if (!isNullOrUndefined(entry)) {
      this.dropFile(entry);
      if (Functions.contains(entry, '.wav')) {
        this._oaudiofile = null;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      setTimeout(() => {
        this.dropzone.clicklocked = false;
      }, 300);
    }
  }
}
