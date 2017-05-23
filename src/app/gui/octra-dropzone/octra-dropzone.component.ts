import {Component, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile} from '../../types/annotjson';
import {AudioInfo} from '../../shared/AudioInfo';
import {FileSize, Functions} from '../../shared/Functions';
import {AppInfo} from '../../app.info';
import {isNullOrUndefined} from 'util';
import {Converter} from '../../shared/Converters/Converter';
import {DropZoneComponent} from '../../component/drop-zone/drop-zone.component';
import {SessionFile} from '../../shared/SessionFile';
import {ModalService} from '../../service/modal.service';

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
        const converter: Converter = AppInfo.converters[i].converter;
        if (Functions.contains(file.file.name, AppInfo.converters[i].appendix)) {
          if (converter.conversion.import) {

            const reader: FileReader = new FileReader();

            reader.onloadend = () => {
              if (file.status === 'progress') {
                const ofile = {
                  name: file.file.name,
                  content: reader.result,
                  type: file.file.type,
                  encoding: 'utf-8'
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

            reader.readAsText(file.file, 'utf-8');
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
      file.status = 'valid';
    }
  }

  public afterDrop() {
    this._files = [];
    this._oannotation = null;
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const file = {
        status: 'progress',
        file: this.dropzone.files[i],
        checked_converters: 0
      };

      if (Functions.contains(file.file.name, '.wav')) {
        file.status = 'valid';
        const reader = new FileReader();

        reader.onloadend = () => {

          // check audio
          const info: AudioInfo = new AudioInfo(reader.result);
          info.decodeAudio(reader.result).then(() => {
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
                const newfile = {
                  status: 'progress',
                  file: this.dropzone.files[j],
                  checked_converters: 0
                };
                this._files.push(newfile);
                this.isValidImportData(newfile);
              }
            }
          }).catch(
            (err) => {
              console.error(err);
            }
          );
        };

        reader.readAsArrayBuffer(file.file);
        this._files.push(file);
        break;
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
}
