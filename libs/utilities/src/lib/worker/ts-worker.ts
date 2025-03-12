import { Subject } from 'rxjs';
import { TsWorkerJob, TsWorkerStatus } from './ts-worker-job';

/**
 * Inline web worker that runs jobs asynchronously.
 */
export class TsWorker {
  private static workerID = 1;
  private readonly blobURL: string;
  private worker: Worker;
  private status: TsWorkerStatus = TsWorkerStatus.INITIALIZED;
  private readonly _id: number;

  constructor() {
    this._id = TsWorker.workerID++;
    // creates an worker that runs a job
    this.blobURL = URL.createObjectURL(
      new Blob([TsWorker.getWorkerScript()], {
        type: 'application/javascript',
      }),
    );
    this.worker = new Worker(this.blobURL);
  }

  private _jobstatuschange = new Subject<TsWorkerJob<any, any>>();

  /**
   * triggers whenever a job changed its status
   */
  get jobstatuschange(): Subject<TsWorkerJob<any, any>> {
    return this._jobstatuschange;
  }

  private _queue: TsWorkerJob<any, any>[] = [];

  get queue(): TsWorkerJob<any, any>[] {
    return this._queue;
  }

  get id(): number {
    return this._id;
  }

  /**
   * converts a job to an JSON object
   */
  private static convertJobToObj(job: TsWorkerJob<any, any>) {
    let scriptString =
      typeof job.doFunction === 'string'
        ? job.doFunction
        : job.doFunction.toString();
    scriptString = scriptString
      // remove comments
      .replace(/(\/\*+[^**/]+\*+\/)|(\/\/.*)\n*/g, '')
      .replace(/(function)([^(]*)([^{\n]+)/g, '$3 => ');

    if (eval(`${scriptString}`) === undefined) {
      throw new Error("Can't eval function.");
    }

    return {
      userName: job.id,
      args: job.args,
      doFunction: scriptString,
    };
  }

  /**
   * the script for the inline web worker
   */
  private static getWorkerScript(): string {
    return `var job = undefined;
var base = self;

onmessage = (msg) => {
  var data = msg.data;
  var command = data.command;
  var args = data.args;

  try {
    if (command === "run") {
      base.job = args[0];

      for (let i = 0; i < base.job.args.length; i++) {
        if (typeof base.job.args[i] === "object" && base.job.args[i].isFunction) {
          var evaluated = undefined;

          evaluated = eval("(" + base.job.args[i].funcString + ")");

          base.job.args[i] = evaluated;

          if (!evaluated) {
            throw new Error("Can't evaluate function in args with index " + i);
          }
        }
      }

      var func = eval(base.job.doFunction);
      func(...base.job.args).then((result) => {
        base.postMessage({
          status: "finished",
          result: result
        });
      }).catch((error) => {
        base.postMessage({
          status: "failed",
          message: error
        });
      });
    } else {
      base.postMessage({
        status: "failed",
        message: "invalid command"
      });
    }
  } catch (error) {
    base.postMessage({
      status: "failed",
      message: error.message
    });
  }
};`;
  }

  /**
   * adds a job to the worker's queue and starts it automatically
   * @param job the job to run
   */
  public async addJob(job: TsWorkerJob<any, any>) {
    if (!this.hasJob(job)) {
      this._queue.push(job);
      this.checkBeforeStart();
    } else {
      console.error(
        `job ${job.id} is already in job list of worker ${this._id}`,
      );
    }
  }

  /**
   * removes a job from the queue and tries to start another
   * @param id the job's id
   */
  public removeJobByID(id: number) {
    if (id !== undefined && id > -1) {
      const index = this._queue.findIndex((a) => {
        return a.id === id;
      });
      if (index > -1) {
        this._queue.splice(index, 1);
        this.checkBeforeStart();
      }
    } else {
      console.error(`could not remove job with id ${id} (worker ${this.id})`);
    }
  }

  /**
   * starts the next free job if no other is running.
   */
  public checkBeforeStart() {
    if (this.getRunningJobID() < 0) {
      // no job running, start first job
      const job = this.getFirstFreeJob();
      if (job !== undefined) {
        job.changeStatus(TsWorkerStatus.RUNNING);
        this.run(this._queue[0])
          .then((result: any) => {
            // remove job from job list
            this.removeJobByID(job.id);

            job.result = result;
            job.changeStatus(TsWorkerStatus.FINISHED);
            this._jobstatuschange.next(job);

            this.checkBeforeStart();
          })
          .catch((error) => {
            job.changeStatus(TsWorkerStatus.FAILED);
            this._jobstatuschange.error(error);
            this._jobstatuschange = new Subject();
            this.checkBeforeStart();
          });
      }
    }
  }

  /**
   * returns the first free job
   */
  public getFirstFreeJob(): TsWorkerJob<any, any> | undefined {
    const index = this._queue.findIndex((a) => {
      return a !== undefined && a.status === TsWorkerStatus.INITIALIZED;
    });

    if (index > -1) {
      return this._queue[index];
    }
    return undefined;
  }

  /**
   * returns a job by its id.
   */
  public getRunningJobID() {
    return this._queue.findIndex((a) => {
      return a !== undefined && a.status === TsWorkerStatus.RUNNING;
    });
  }

  /**
   * checks if job is already in the queue
   * @param job job to check
   */
  public hasJob(job: TsWorkerJob<any, any>) {
    return (
      this._queue.findIndex((a) => {
        return a !== undefined && a.id === job.id;
      }) > -1
    );
  }

  /**
   * destroys the Taskmanager if not needed anymore.
   */
  public destroy() {
    URL.revokeObjectURL(this.blobURL);
  }

  /**
   * runs a job. This function is called automatically
   * @param job the job to run
   */
  private run = (job: TsWorkerJob<any, any>): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      this.worker.onmessage = (ev: MessageEvent) => {
        job.statistics.ended = Date.now();
        this.status = ev.data.status;

        if (ev.data.status === 'finished') {
          this.removeJobByID(job.id);
          resolve(ev.data.result);
        } else if (ev.data.status === 'failed') {
          this.removeJobByID(job.id);
          reject(ev.data.message);
        }
      };

      this.worker.onerror = (err) => {
        this.status = TsWorkerStatus.FAILED;
        this.removeJobByID(job.id);
        reject(err);
      };

      job.statistics.started = Date.now();
      this.worker.postMessage({
        command: 'run',
        args: [TsWorker.convertJobToObj(job)],
      });
    });
  };
}
