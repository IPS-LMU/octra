import {Injectable} from '@angular/core';
import {SubscriptionManager} from '@octra/utilities';
import {TsWorker} from './ts-worker';
import {TsWorkerJob, TsWorkerStatus} from './ts-worker-job';

@Injectable()
export class MultiThreadingService {
  private numberOfThreads = 2;
  private subscrManager: SubscriptionManager = new SubscriptionManager();

  private _workers: TsWorker[] = [];

  get workers(): TsWorker[] {
    return this._workers;
  }

  constructor() {
    for (let i = 0; i < this.numberOfThreads; i++) {
      this._workers.push(new TsWorker());
    }
  }

  public run(job: TsWorkerJob): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      const bestWorker = this.getBestWorker();

      if (bestWorker !== null) {
        const id = this.subscrManager.add(bestWorker.jobstatuschange.subscribe(
          (changedJob: TsWorkerJob) => {
            if (changedJob.id === job.id) {
              if (changedJob.status === TsWorkerStatus.FINISHED) {
                resolve(changedJob.result);
              } else if (changedJob.status === TsWorkerStatus.FAILED) {
                reject(`job id ${job.id} failed in worker ${bestWorker.id}`);
              }

              // unsubscribe because not needed anymore
              this.subscrManager.removeById(id);
            }
          }, (error) => {
            reject(error);
          }
        ));

        bestWorker.addJob(job);
      } else {
        console.error(new Error(`found no worker to run job ${job.id}`));
      }

    });
  }

  public getStatistics(): string {
    let result = '';
    for (const worker of this.workers) {
      result += `----- worker id ${worker.id} ----\n` + `jobs: ${worker.queue.length}\n----\n`;
    }

    return result;
  }

  public destroy() {
    this.subscrManager.destroy();
  }

  private getBestWorker(): TsWorker {
    let foundWorker: TsWorker = null;

    for (const worker of this._workers) {
      if (foundWorker === null) {
        foundWorker = worker;
      } else if (worker.queue.length < foundWorker.queue.length) {
        foundWorker = worker;
      }
    }

    return foundWorker;
  }
}
