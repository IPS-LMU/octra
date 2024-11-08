export enum TsWorkerStatus {
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  FINISHED = 'finished',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

/**
 * This class defines a task with given function and parameters.
 */
export class TsWorkerJob<I extends Array<any> = Array<any>, O = unknown> {
  private static jobIDCounter = 0;
  args: I;
  private readonly _id: number;

  /**
   * returns id of the job
   */
  get id(): number {
    return this._id;
  }

  private _statistics = {
    started: -1,
    ended: -1,
  };

  /**
   * returns timing statistics
   */
  get statistics(): { ended: number; started: number } {
    return this._statistics;
  }

  /**
   * sets timing statistics
   * @param value start and end time
   */
  set statistics(value: { ended: number; started: number }) {
    this._statistics = value;
  }

  private _result: any;

  /**
   * result of the ran function
   */
  get result(): any {
    return this._result;
  }

  set result(value: any) {
    this._result = value;
  }

  private _status: TsWorkerStatus = TsWorkerStatus.INITIALIZED;

  /**
   * current status
   */
  get status(): TsWorkerStatus {
    return this._status;
  }

  constructor(doFunction: ((...args: I) => Promise<O>) | string, ...args: I) {
    this._id = ++TsWorkerJob.jobIDCounter;
    this.doFunction = doFunction;
    this.args = args;
  }

  /**
   * this function will be run in the web worker
   */
  doFunction: ((...args: I) => Promise<O>) | string = (...args: I) => {
    return new Promise<O>((resolve, reject) => {
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
