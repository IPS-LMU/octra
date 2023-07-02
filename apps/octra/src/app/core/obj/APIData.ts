export class APIData {
  private readonly _id: number;
  private readonly _annotator: string;
  private readonly _annobegin: string;
  private readonly _annoend: string;
  private readonly _url: string;
  private readonly _segmentbegin: number;
  private readonly _segmentend: number;
  private readonly _priority: number;
  private readonly _status: string;
  private readonly _project: string;
  private readonly _jobno: number;

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
    id: number,
    annotator: string,
    annobegin: string,
    annoend: string,
    url: string,
    segmentbegin: number,
    segmentend: number,
    priority: number,
    status: string,
    project: string,
    jobno: number
  ) {
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
