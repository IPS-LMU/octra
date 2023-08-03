export enum TsWorkerStatus {
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  FINISHED = 'finished',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

export class TsWorkerJob {
  private static jobIDCounter = 0;
  args: any[] = [];
  private readonly _id: number;

  get id(): number {
    return this._id;
  }

  private _statistics = {
    started: -1,
    ended: -1,
  };

  get statistics(): { ended: number; started: number } {
    return this._statistics;
  }

  set statistics(value: { ended: number; started: number }) {
    this._statistics = value;
  }

  private _result: any;

  get result(): any {
    return this._result;
  }

  set result(value: any) {
    this._result = value;
  }

  private _status: TsWorkerStatus = TsWorkerStatus.INITIALIZED;

  get status(): TsWorkerStatus {
    return this._status;
  }

  constructor(
    doFunction: ((...args: any[]) => Promise<any>) | string,
    args: any[]
  ) {
    this._id = ++TsWorkerJob.jobIDCounter;
    this.doFunction = doFunction;
    this.args = args;
  }

  /**
   * this function will be run in the web worker
   */
  doFunction: ((args: any[]) => Promise<any>) | string = (args: any[]) => {
    return new Promise<any>((resolve, reject) => {
      reject('not implemented');
    });
  };

  /**
   * changes this job's status
   * @param status the status to change
   */
  public changeStatus(status: TsWorkerStatus) {
    this._status = status;
  }
}
