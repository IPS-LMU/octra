import { Injectable } from '@angular/core';
import {
  SubscriptionManager,
  TsWorker,
  TsWorkerJob,
  TsWorkerStatus,
} from '@octra/utilities';
import { Subscription } from 'rxjs/internal/Subscription';

@Injectable({
  providedIn: 'root',
})
export class MultiThreadingService {
  private numberOfThreads = 2;
  private subscrManager = new SubscriptionManager<Subscription>();

  private _workers: TsWorker[] = [];

  get workers(): TsWorker[] {
    return this._workers;
  }

  constructor() {
    for (let i = 0; i < this.numberOfThreads; i++) {
      this._workers.push(new TsWorker());
    }
  }

  public run<T>(job: TsWorkerJob): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const bestWorker = this.getBestWorker();

      if (bestWorker !== undefined) {
        const id = this.subscrManager.add(
          bestWorker.jobstatuschange.subscribe(
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
            },
            (error: any) => {
              reject(error);
            },
          ),
        );

        bestWorker.addJob(job);
      } else {
        console.error(new Error(`found no worker to run job ${job.id}`));
      }
    });
  }

  public getStatistics(): string {
    let result = '';
    for (const worker of this.workers) {
      result +=
        `----- worker id ${worker.id} ----\n` +
        `jobs: ${worker.queue.length}\n----\n`;
    }

    return result;
  }

  public destroy() {
    this.subscrManager.destroy();
  }

  private getBestWorker(): TsWorker | undefined {
    let foundWorker: TsWorker | undefined = undefined;

    for (const worker of this._workers) {
      if (foundWorker === undefined) {
        foundWorker = worker;
      } else if (worker.queue.length < foundWorker.queue.length) {
        foundWorker = worker;
      }
    }

    return foundWorker;
  }
}
