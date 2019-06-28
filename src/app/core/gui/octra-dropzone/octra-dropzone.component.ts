import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile, OLabel, OSegment} from '../../obj/Annotation';
import {AppInfo} from '../../../app.info';
import {Converter, IFile, ImportResult} from '../../obj/Converters';
import {DropZoneComponent} from '../../component/drop-zone';
import {SessionFile} from '../../obj/SessionFile';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../../modals/modal.service';
import {FileSize, Functions, isNullOrUndefined} from '../../shared/Functions';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';

interface FileProgress {
  status: 'progress' | 'valid' | 'invalid';
  file: File;
  checked_converters: number;
  progress: number;
  error: string;
}

@Component({
  selector: 'app-octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.css']
})
export class OctraDropzoneComponent implements OnInit, OnDestroy {

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  public get files(): FileProgress[] {
    return this._files;
  }

  get oaudiofile(): OAudiofile {
    return this._oaudiofile;
  }

  get oannotation(): OAnnotJSON {
    return this._oannotation;
  }

  get status(): string {
    return this._status;
  }

  get audiomanager(): AudioManager {
    return this._audiomanager;
  }

  constructor(private modService: ModalService) {
  }

  @ViewChild('dropzone', {static: true}) dropzone: DropZoneComponent;
  @Input() height = '250px';
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  public _files: FileProgress[] = [];

  private _oaudiofile: OAudiofile;

  private _oannotation: OAnnotJSON;

  private _status: string;

  private _audiomanager: AudioManager;

  private readonly maxAudioFileSize = 300;

  public afterDrop = () => {
    this._oannotation = null;
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const fileProcess: FileProgress = {
        status: 'progress',
        file: this.dropzone.files[i],
        checked_converters: 0,
        progress: 0,
        error: ''
      };

      // check if an audio and a format file already exists
      let dataFile = null;
      let audioFile = null;
      for (const fileAny of this.files) {
        if (AudioManager.isValidAudioFileName(fileAny.file.name, AppInfo.audioformats)) {
          audioFile = fileAny;
        } else if (fileAny.file.name === fileProcess.file.name) {
          dataFile = fileAny;
        }
      }

      if (AudioManager.isValidAudioFileName(fileProcess.file.name, AppInfo.audioformats)) {
        // the latest dropped file is an audio file
        fileProcess.status = 'progress';
        const reader = new FileReader();

        this.resetFormatFileProgresses();

        // drop previous audio files
        for (const audioFormat of AppInfo.audioformats) {
          this.dropFile(audioFormat.extension, true);
        }
        this._oaudiofile = null;

        this._files.push(fileProcess);

        reader.onloadend = () => {
          if (fileProcess.file.size <= this.maxAudioFileSize * 1024 * 1024) {
            this.decodeArrayBuffer((reader.result as ArrayBuffer), this._files.length - 1);
          } else {
            fileProcess.status = 'invalid';
            fileProcess.error = `The file size is bigger than ${this.maxAudioFileSize} MB.`;
          }
        };
        reader.onprogress = (e) => {
          fileProcess.progress = ((e.loaded / e.total)) / (AudioManager.getNumberOfDataParts(fileProcess.file.size) + 1);
        };

        reader.readAsArrayBuffer(fileProcess.file);
        break;
      } else {
        // the latest dropped file is a format file
        if (!(audioFile === null || audioFile === undefined)) {
          const extension = audioFile.file.name.substr(audioFile.file.name.lastIndexOf('.'));
          this.loadImportFileData(extension);
        } else {
          this.loadImportFileData();
        }
      }
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  private loadImportFileData(extension: string = null) {
    for (let j = 0; j < this.dropzone.files.length; j++) {
      const importfile = this.dropzone.files[j];

      if (isNullOrUndefined(extension)) {
        extension = importfile.name.substr(importfile.name.lastIndexOf('.'));
      }

      this.dropFile(extension, true, true);

      const newfile: FileProgress = {
        status: 'progress',
        file: this.dropzone.files[j],
        checked_converters: 0,
        progress: 0,
        error: ''
      };
      this._files.push(newfile);
      this.isValidImportData(newfile);
    }
  }

  public isValidImportData(file: FileProgress) {
    if (!isNullOrUndefined(this._oaudiofile)) {
      for (let i = 0; i < AppInfo.converters.length; i++) {
        const converter: Converter = AppInfo.converters[i];
        if (Functions.contains(file.file.name.toLowerCase(), AppInfo.converters[i].extension.toLowerCase())) {
          if (converter.conversion.import) {

            const reader: FileReader = new FileReader();
            reader.onloadend = () => {
              if (file.status === 'progress') {
                const ofile: IFile = {
                  name: file.file.name,
                  content: reader.result as string,
                  type: file.file.type,
                  encoding: converter.encoding
                };

                const audioName = this._oaudiofile.name.substr(0, this._oaudiofile.name.lastIndexOf('.'));
                if ((file.file.name === audioName + AppInfo.converters[i].extension)
                  || file.file.name === audioName + AppInfo.converters[i].extension.toLowerCase()) {
                  const importResult: ImportResult = converter.import(ofile, this._oaudiofile);

                  const setAnnotation = () => {
                    if (!isNullOrUndefined(this._oaudiofile) &&
                      !isNullOrUndefined(importResult.annotjson) && importResult.error === '') {
                      file.status = 'valid';
                      if (!(this._oaudiofile === null || this._oaudiofile === undefined)) {
                        for (const level of importResult.annotjson.levels) {
                          if (level.type === 'SEGMENT') {
                            if (level.items[0].sampleStart !== 0) {
                              let temp = [];
                              temp.push(new OSegment(0, 0, level.items[0].sampleStart, [new OLabel(level.name, '')]));
                              temp = temp.concat(level.items);
                              level.items = temp;

                              for (let j = 1; j < level.items.length + 1; j++) {
                                level.items[j - 1].id = j;
                              }
                              i++;
                            }

                            const last = level.items[level.items.length - 1];
                            if (last.sampleStart + last.sampleDur !== this._oaudiofile.duration) {
                              level.items.push(new OSegment(last.id + 1, last.sampleStart + last.sampleDur,
                                (this._oaudiofile.duration * this._oaudiofile.samplerate) - (last.sampleStart + last.sampleDur),
                                [new OLabel(level.name, '')]));
                            }
                          }
                        }
                      }
                      this._oannotation = importResult.annotjson;
                      this.checkState();
                    } else {
                      if (file.checked_converters >= AppInfo.converters.length || converter.name === 'Bundle') {
                        // last converter to check
                        file.status = 'invalid';
                        file.error = importResult.error;
                        this._oannotation = null;
                        this.checkState();
                      }
                    }
                  };

                  if (!(importResult === null || importResult === undefined)
                    && !(importResult.audiofile === null || importResult.audiofile === undefined)) {
                    // is bundle file
                    this.dropFile('_bndl.json', true, true);
                    const audioProcess: FileProgress = {
                      status: 'progress',
                      file: new File([importResult.audiofile.arraybuffer], importResult.audiofile.name),
                      checked_converters: 0,
                      progress: 0,
                      error: ''
                    };
                    this._files.push(audioProcess);
                    // TODO bundle file check
                    /* this.decodeArrayBuffer(importResult.audiofile.arraybuffer, audioProcess, false).then(
                      () => {
                        setAnnotation();
                      }
                    ).catch((err) => {
                      console.error(err);
                    }); */
                  } else {
                    setAnnotation();
                  }

                  file.checked_converters++;
                } else {
                  file.status = 'invalid';
                  file.error = `format file must have the same name as the audio file.`;
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
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
  }

  showSupported() {
    this.modService.show('supportedfiles');
  }

  onDeleteEntry(entry: string) {
    if (!(entry === null || entry === undefined)) {
      this.dropFile(entry);
      if (Functions.contains(entry, '.wav') || Functions.contains(entry, '.ogg')) {
        this._oaudiofile = null;
        AudioManager.stopDecoding();
        this.resetFormatFileProgresses();
      } else {
        this._oannotation = null;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      setTimeout(() => {
        this.dropzone.clicklocked = false;
      }, 300);
    }
  }

  private resetFormatFileProgresses() {
    for (let i = 0; i < this._files.length; i++) {
      this._files[i].checked_converters = 0;
      this._files[i].status = 'progress';
      this._files[i].error = '';
    }
  }

  private checkState() {
    if ((this._files === null || this._files === undefined)) {
      this._status = 'empty';
    } else {
      if (!(this.oaudiofile === null || this.oaudiofile === undefined)) {
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

  private decodeArrayBuffer(buffer: ArrayBuffer,
                            fileProcessIndex: number,
                            checkimport = true) {
    const fileProcess = this._files[fileProcessIndex];
    const extension = fileProcess.file.name.substr(fileProcess.file.name.lastIndexOf('.'));
    // check audio
    this.subscrmanager.add(AudioManager.decodeAudio(fileProcess.file.name, fileProcess.file.type, buffer, AppInfo.audioformats).subscribe(
      (result) => {
        fileProcess.progress = (result.decodeProgress + 1) / 2;
        // console.log((window.performance as any).memory.jsHeapSizeLimit - (window.performance as any).memory.usedJSHeapSize);

        if (isNullOrUndefined(result.audioManager)) {
          // not finished
        } else {
          // finished, get result

          if (!(this._audiomanager === null || this._audiomanager === undefined)) {
            this._audiomanager.destroy();
            this._audiomanager = null;
          }

          this._audiomanager = result.audioManager;
          fileProcess.status = 'valid';
          this._oaudiofile = new OAudiofile();
          this._oaudiofile.name = fileProcess.file.name;
          this._oaudiofile.size = fileProcess.file.size;
          this._oaudiofile.duration = this._audiomanager.ressource.info.duration.browserSample.value;
          this._oaudiofile.samplerate = this._audiomanager.originalSampleRate;
          this._oaudiofile.arraybuffer = buffer;

          this.checkState();

          if (checkimport) {
            // load import data
            for (let j = 0; j < this.dropzone.files.length; j++) {
              const importfile = this.dropzone.files[j];
              if (!AudioManager.isValidAudioFileName(importfile.name, AppInfo.audioformats)) {
                this.dropFile(importfile.name);

                const newfile: FileProgress = {
                  status: 'progress',
                  file: this.dropzone.files[j],
                  checked_converters: 0,
                  progress: 0,
                  error: ''
                };
                this.dropFile(extension, true, true);
                this._files.push(newfile);
                this.isValidImportData(newfile);
              }
            }

            // check for data already exist
            for (let j = 0; j < this.files.length; j++) {
              const importfile = this.files[j].file;
              if (!AudioManager.isValidAudioFileName(importfile.name, AppInfo.audioformats)) {
                this.files[j].status = 'progress';
                this.files[j].checked_converters = 0;
                this.isValidImportData(this.files[j]);
                break;
              }
            }
          }
        }
      },
      (error) => {
        console.error(error);
      }));
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
}
