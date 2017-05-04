import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorage, LocalStorageService, SessionStorage, SessionStorageService} from 'ng2-webstorage';
import {SessionFile} from '../shared/SessionFile';
import {isNullOrUndefined} from 'util';
import {DropZoneComponent} from '../component/drop-zone/drop-zone.component';

@Injectable()
export class SessionService {
  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }
  get reloaded(): boolean {
    return this._reloaded;
  }

  set reloaded(value: boolean) {
    this._reloaded = value;
  }
  get playonhover(): boolean {
    return this._playonhover;
  }

  set playonhover(value: boolean) {
    this._playonhover = value;
  }

  get agreement(): any {
    return this._agreement;
  }

  set agreement(value: any) {
    this._agreement = value;
  }

  set comment(value: string) {
    this._comment = value;
  }

  get comment(): string {
    return this._comment;
  }

  get easymode(): boolean {
    return this._easymode;
  }

  set easymode(value: boolean) {
    this._easymode = value;
  }

  set language(value: string) {
    this._language = value;
    this.sessStr.store('language', this._language);
  }

  get language(): string {
    return this._language;
  }

  get sessionfile(): SessionFile {
    return SessionFile.fromAny(this._sessionfile);
  }

  set sessionfile(value: SessionFile) {
    this._sessionfile = (value != null) ? value.toAny() : null;
    this.localStr.store('sessionfile', this._sessionfile);
  }

  get offline(): boolean {
    return this._offline;
  }

  set offline(value: boolean) {
    this._offline = value;
    this.sessStr.store('offline', value);
  }

  get audio_url(): string {
    return this._audio_url;
  }

  set audio_url(value: string) {
    this._audio_url = value;
    this.localStr.store('audio_url', value);
  }

  get data_id(): number {
    return this._data_id;
  }

  set data_id(value: number) {
    this._data_id = value;
    this.localStr.store('data_id', value);
  }

  get logs(): any[] {
    return this._logs;
  }

  set logs(value: any[]) {
    this._logs = value;
  }

  get feedback(): any {
    return this._feedback;
  }

  set feedback(value: any) {
    this._feedback = value;
  }

  get transcription(): any {
    return this._transcription;
  }

  set transcription(value: any) {
    this._transcription = value;
    this.localStr.store('transcription', value);
  }

  // SESSION STORAGE
  @SessionStorage('session_key') session_key: string;
  @SessionStorage() logged_in: boolean;
  @SessionStorage() logInTime: number; // timestamp
  @SessionStorage() finishedTranscriptions: number;
  @SessionStorage() nextTranscription = 0;
  @SessionStorage() transcriptionTime: any = {
    start: 0,
    end: 0
  };
  @SessionStorage('interface') _interface: string;
  @SessionStorage('samplerate') _samplerate: number;
  @SessionStorage('agreement') private _agreement: any;
  @SessionStorage('jobs_left') jobs_left: number;
  @SessionStorage('playonhover') private _playonhover: boolean;
  @SessionStorage('reloaded') private _reloaded: boolean;
  @SessionStorage('email') private _email: string;


  // LOCAL STORAGE
  @LocalStorage('transcription') private _transcription: any;
  @LocalStorage('submitted') private _submitted: boolean;
  @LocalStorage('feedback') private _feedback: any;
  @LocalStorage('logs') private _logs: any[];
  @LocalStorage('data_id') private _data_id: number;
  @LocalStorage('audio_url') private _audio_url: string;
  @LocalStorage('offline') private _offline: boolean;
  @LocalStorage('sessionfile') _sessionfile: any;
  @LocalStorage('language') private _language: string;
  @LocalStorage() member_id: string;
  @LocalStorage() member_project: string;
  @LocalStorage() member_jobno: string;
  @LocalStorage('easymode') private _easymode: boolean;
  @LocalStorage('comment') private _comment: string;

  // is user on the login page?
  private login: boolean;

  public file: File;
  public saving: EventEmitter<boolean> = new EventEmitter<boolean>();

  get SessionKey(): string {
    return this.session_key;
  }

  get MemberID(): string {
    return this.member_id;
  }

  get MemberProject(): string {
    return this.member_project;
  }

  get MemberJobno(): string {
    return this.member_jobno;
  }

  get LoggedIn(): boolean {
    return this.logged_in;
  }

  get Interface(): string {
    return this._interface;
  }

  get FinishedTranscriptions(): number {
    return this.finishedTranscriptions;
  }

  get TranscriptionTime(): any {
    return this.transcriptionTime;
  }

  set Interface(new_interface: string) {
    this._interface = new_interface;
    this.sessStr.store('interface', new_interface);
  }

  set TranscriptionTime(n: any) {
    this.transcriptionTime = n;
    this.sessStr.store('transcriptionTime', this.transcriptionTime);
  }

  set SampleRate(samplerate: number) {
    this._samplerate = samplerate;
    this.sessStr.store('samplerate', this._samplerate);
  }

  get SampleRate(): number {
    return this._samplerate;
  }

  get submitted(): boolean {
    return this._submitted;
  }

  set submitted(value: boolean) {
    this._submitted = value;
  }

  constructor(public sessStr: SessionStorageService,
              public localStr: LocalStorageService) {
  }

  /**
   * Sets session_key. Returns true on success, false on failure
   * @param member_id
   * @returns {boolean}
   */
  private setNewSessionKey() {
    this.session_key = '';
    this.sessStr.store('session_key', this.session_key);
  }

  public setSessionData(member: any, data_id: number, audio_url: string, offline: boolean = false): { error: string } {
    if (isNullOrUndefined(this._easymode)) {
      this._easymode = false;
    }
    if (offline && (isNullOrUndefined(member))) {
      if (isNullOrUndefined(this._interface)) {
        this._interface = '2D-Editor';
      }
      this.setNewSessionKey();
      this.localStr.store('offline', true);
      this.localStr.store('member_project', '');
      this.localStr.store('member_jobno', '-1');
      this.sessStr.store('transcriptionTime', {start: 0, end: 0});
      this.setMemberID('-1');
      this.login = true;
      this.logged_in = true;

      return {error: ''};
    }

    if (!this.login && !offline && (!isNullOrUndefined(member))) {
      if (isNullOrUndefined(this._interface)) {
        this._interface = '2D-Editor';
      }
      this.setNewSessionKey();
      this.setMemberID(member.id);

      this.sessStr.store('logInTime', Date.now());
      this.sessStr.store('logged_in', this.logged_in);
      this.sessStr.store('finishedTranscriptions', 0);
      this.sessStr.store('nextTranscription', 0);
      this.sessStr.store('transcriptionTime', {start: 0, end: 0});
      this.localStr.store('data_id', data_id);
      this.localStr.store('audio_url', audio_url);
      this.sessStr.store('interface', this._interface);
      this.localStr.store('member_project', member.project);
      this.localStr.store('member_jobno', member.jobno);
      this.localStr.store('offline', false);
      this.login = true;
      this.logged_in = true;

      return {error: ''};
    }

    return {error: ''};
  }

  /**
   * Sets member_id. Returns true on success, false on failure
   * @param member_id
   * @returns {boolean}
   */
  private setMemberID(member_id: string): boolean {
    this.member_id = member_id;
    this.localStr.store('member_id', this.member_id);
    return true;
  }

  public clearSession(): boolean {
    this.logged_in = false;
    this.login = false;

    this.sessStr.clear();

    return (this.sessStr.retrieve('session_key') == null
    && this.sessStr.retrieve('member_id') == null);
  }

  public clearLocalStorage(): boolean {
    this.logged_in = false;
    this.login = false;
    this.localStr.clear();

    return (this.sessStr.retrieve('data_id') == null
    && this.sessStr.retrieve('audio_url') == null);
  }

  public incrementFinishedTranscriptions() {
    this.finishedTranscriptions++;
  }

  public save(key: string, value: any): boolean {
    this.saving.emit(true);
    switch (key) {
      case 'transcription':
        this.localStr.store(key, value);
        break;
      case 'feedback':
        this.localStr.store(key, value);
        break;
      case 'logs':
        this.localStr.store(key, value);
        break;
      default:
        return false; // if key not found return false
    }
    this.saving.emit(false);
    return true;
  }

  public beginLocalSession = (dropzone: DropZoneComponent, keep_data: boolean, navigate: () => void, err: (error: string) => void) => {
    if (!isNullOrUndefined(dropzone.file)) {
      const type: string = (dropzone.file.type) ? dropzone.file.type : 'unknown';

      if (type === 'audio/x-wav' || type === 'audio/wav') {

        if (!keep_data) {
          // delete old data from previous session
          console.error('clear session');
          this.clearSession();
          this.clearLocalStorage();
        }

        if (this.member_id != null && this.member_id !== '-1' && this.member_id !== '') {
          // last was online mode
          console.error('clear session m');
          this.clearSession();
          this.clearLocalStorage();
        }

        const res = this.setSessionData(null, null, null, true);
        if (res.error === '') {
          this.offline = true;
          this.sessionfile = this.getSessionFile(dropzone.file);

          this.file = dropzone.file;
          navigate();
        } else {
          err(res.error);
        }
      } else {
        err('type not supported');
      }
    }
  }

  public endSession(offline: boolean, navigate: () => void) {
    this.clearSession();
    navigate();
  }

  public getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      file.lastModifiedDate,
      file.type
    );
  }
}
