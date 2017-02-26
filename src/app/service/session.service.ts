import { Injectable } from '@angular/core';
import { SessionStorage, LocalStorage, SessionStorageService, LocalStorageService } from 'ng2-webstorage';
import { SessionFile } from "../shared/SessionFile";

@Injectable()
export class SessionService {
	set language(value: string) {
		this._language = value;
		this.sessStr.store("language", this._language);
	}
	get language(): string {
		return this._language;
	}
	get sessionfile(): SessionFile {
		return SessionFile.fromAny(this._sessionfile);
	}

	set sessionfile(value: SessionFile) {
		this._sessionfile = value.toAny();
		this.localStr.store("sessionfile", this._sessionfile);
	}

	get offline(): boolean {
		return this._offline;
	}

	set offline(value: boolean) {
		this._offline = value;
		this.sessStr.store("offline", value);
	}

	get audio_url(): string {
		return this._audio_url;
	}

	set audio_url(value: string) {
		this._audio_url = value;
		this.localStr.store("audio_url", value);
	}

	get data_id(): number {
		return this._data_id;
	}

	set data_id(value: number) {
		this._data_id = value;
		this.localStr.store("data_id", value);
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
		this.localStr.store("transcription", value);
	}

	//SESSION STORAGE
	@SessionStorage('session_key') session_key: string;
	@SessionStorage() member_id: string;
	@SessionStorage() logged_in: boolean;
	@SessionStorage() logInTime: number; //timestamp
	@SessionStorage() finishedTranscriptions: number;
	@SessionStorage() nextTranscription: number = 0;
	@SessionStorage() transcriptionTime: any = {
		start: 0,
		end  : 0
	};
	@SessionStorage('interface') _interface: string;
	@SessionStorage('samplerate') _samplerate: number;


	//LOCAL STORAGE
	@LocalStorage('transcription') private _transcription: any;
	@LocalStorage('submitted') private _submitted: boolean;
	@LocalStorage('feedback') private _feedback: any;
	@LocalStorage('logs') private _logs: any[];
	@LocalStorage('data_id') private _data_id: number;
	@LocalStorage('audio_url') private _audio_url: string;
	@LocalStorage('offline') private _offline: boolean;
	@LocalStorage('sessionfile') _sessionfile: any;
	@LocalStorage('language') private _language: string;

	//is user on the login page?
	private login: boolean;

	public file:File;

	get SessionKey(): string {
		return this.session_key;
	}

	get MemberID(): string {
		return this.member_id;
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
		this.sessStr.store("interface", new_interface);
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

	constructor(private sessStr: SessionStorageService,
				private localStr: LocalStorageService) {
	}

	/**
	 * Sets session_key. Returns true on success, false on failure
	 * @param member_id
	 * @returns {boolean}
	 */
	private setNewSessionKey() {
		this.session_key = "";
		this.sessStr.store("session_key", this.session_key);
	}

	public setSessionData(member_id: string, data_id: number, audio_url: string): {error: string} {
		if (!this.login) {
				let interface_id: number = Number(member_id) % 3;

				if (interface_id == 0) this._interface = "audioplayer";
				else if (interface_id == 1) this._interface = "signaldisplay";
				else if (interface_id == 2) this._interface = "overlay";

				this.setNewSessionKey();
				this.setMemberID(member_id);

				this.sessStr.store("logInTime", Date.now());
				this.sessStr.store("logged_in", this.logged_in);
				this.sessStr.store("finishedTranscriptions", 0);
				this.sessStr.store("nextTranscription", 0);
				this.sessStr.store("transcriptionTime", { start: 0, end: 0 });
				this.localStr.store("data_id", data_id);
				this.localStr.store("audio_url", audio_url);
				this.sessStr.store("interface", this._interface);
				this.login = true;
				this.logged_in = true;
		}

		return { error: "" };
	}

	/**
	 * Sets member_id. Returns true on success, false on failure
	 * @param member_id
	 * @returns {boolean}
	 */
	private setMemberID(member_id: string): boolean {
		this.member_id = member_id;
		this.sessStr.store("member_id", this.member_id);
		return true;
	}

	public clearSession(): boolean {
		this.logged_in = false;
		this.login = false;

		this.sessStr.clear();
		if(this.sessStr.retrieve('session_key') == null
			&& this.sessStr.retrieve('member_id') == null)
			return true;

		return false;
	}

	public clearLocalStorage(): boolean {
		this.logged_in = false;
		this.login = false;
		this.localStr.clear();

		if (this.sessStr.retrieve('data_id') == null
			&& this.sessStr.retrieve('audio_url') == null)
			return true;

		return false;
	}

	public incrementFinishedTranscriptions() {
		this.finishedTranscriptions++;
	}

	public save(key: string, value: any): boolean {
		switch (key) {
			case "transcription":
				this.localStr.store(key, value);
				break;
			case "feedback":
				this.localStr.store(key, value);
				break;
			case "logs":
				this.localStr.store(key, value);
				break;
			default:
				return false; //if key not found return false
		}
		return true;
	}
}
