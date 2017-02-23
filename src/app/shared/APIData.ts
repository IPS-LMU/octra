export class APIData{

	private _id: number;
	private _annotator:string;
	private _annobegin: string;
	private _annoend: string;
	private _url: string;
	private _segmentbegin: number;
	private _segmentend: number;
	private _priority: number;
	private _status: string;
	private _project: string;
	private _jobno:number;

	get id(): number {
		return this._id;
	}

	get annotator(): string {
		return this._annotator;
	}

	get annobegin(): string {
		return this._annobegin;
	}

	get annoend(): string {
		return this._annoend;
	}

	get url(): string {
		return this._url;
	}

	get segmentbegin(): number {
		return this._segmentbegin;
	}

	get segmentend(): number {
		return this._segmentend;
	}

	get priority(): number {
		return this._priority;
	}

	get status(): string {
		return this._status;
	}

	get project(): string {
		return this._project;
	}

	get jobno(): number {
		return this._jobno;
	}

	constructor(
		id:number,
		annotator:string,
		annobegin: string,
		annoend: string,
		url: string,
		segmentbegin: number,
		segmentend: number,
		priority: number,
		status: string,
		project: string,
		jobno:number
	){
		this._id = id;
		this._annotator = annotator;
		this._annobegin = annobegin;
		this._annoend = annoend;
		this._url = url;
		this._segmentbegin = segmentbegin;
		this._segmentend = segmentend;
		this._priority = priority;
		this._status = status;
		this._project = project;
		this._jobno = jobno;
	}
}