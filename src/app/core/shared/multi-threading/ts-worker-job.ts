export enum TsWorkerStatus {
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  FINISHED = 'finished',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

export class TsWorkerJob {
  get result(): any {
    return this._result;
  }

  set result(value: any) {
    this._result = value;
  }

  set statistics(value: { ended: number; started: number }) {
    this._statistics = value;
  }

  get statistics(): { ended: number; started: number } {
    return this._statistics;
  }

  get status(): TsWorkerStatus {
    return this._status;
  }

  get id(): number {
    return this._id;
  }

  private static jobIDCounter = 0;
  private _statistics = {
    started: -1,
    ended: -1
  };

  private readonly _id: number;
  private _result: any;
  private _status: TsWorkerStatus = TsWorkerStatus.INITIALIZED;

  args: any[] = [];

  constructor(doFunction: (args: any[]) => Promise<any>, args: any[]) {
    this._id = ++TsWorkerJob.jobIDCounter;
    this.doFunction = doFunction;
    this.args = args;
  }

  /**
   * this function will be run in the web worker
   */
  doFunction = (args: any[]) => {
    return new Promise<any>((resolve, reject) => {
      reject('not implemented');
    });
  }

  /**
   * changes this job's status
   * @param status the status to change
   */
  public changeStatus(status: TsWorkerStatus) {
    this._status = status;
  }
}
