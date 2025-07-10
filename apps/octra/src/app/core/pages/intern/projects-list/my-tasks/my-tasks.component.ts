import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbPaginationModule, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { OAnnotJSON, TextConverter } from '@octra/annotation';
import {
  ProjectDto,
  TaskDto,
  TaskInputOutputDto,
  TaskStatus,
} from '@octra/api-types';
import { OAudiofile } from '@octra/media';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { removeProperties } from '@octra/utilities';
import { DefaultComponent } from '../../../../component/default.component';
import {
  findCompatibleFileFromIO,
  isValidAnnotation,
  LuxonShortDateTimePipe,
} from '../../../../shared';
import { AlertService } from '../../../../shared/service';
import { AuthenticationStoreService } from '../../../../store/authentication';

class PreparedTask extends TaskDto {
  transcript?: string;
  audio?: {
    url: string;
    type: string;
    name: string;
  };
  api: OctraAPIService;

  constructor(api: OctraAPIService, partial?: TaskDto) {
    super();
    Object.assign(this, partial);
    this.api = api;
    this.readTranscriptFile();
  }

  private async readTranscriptFile() {
    const audioFile = findCompatibleFileFromIO(this, 'audio', (io) => {
      if (io.fileType.includes('audio')) {
        return io;
      }
      return undefined;
    });

    if (
      audioFile?.metadata?.sampleRate &&
      audioFile?.metadata?.duration?.seconds
    ) {
      this.audio = {
        name: audioFile.filename,
        url: this.api.prepareFileURL(audioFile?.url),
        type: audioFile.fileType,
      };

      const oAudioFile = new OAudiofile();
      oAudioFile.name = audioFile.filename;
      oAudioFile.type = audioFile.fileType;
      oAudioFile.size = audioFile.size;
      oAudioFile.duration = audioFile.metadata.duration.seconds;
      oAudioFile.sampleRate = audioFile.metadata.sampleRate;

      const transcriptFile = findCompatibleFileFromIO<
        | {
            annotjson: OAnnotJSON;
            converter?: string;
          }
        | undefined
      >(this, 'transcript', (io: TaskInputOutputDto) => {
        return isValidAnnotation(io, oAudioFile);
      });

      if (transcriptFile?.annotjson) {
        const textConverter = new TextConverter();
        this.transcript = textConverter.export(
          OAnnotJSON.deserialize(transcriptFile.annotjson),
          oAudioFile,
          0,
        )?.file?.content;
      }
    }
  }
}

@Component({
  selector: 'octra-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
  animations: [],
  imports: [
    TranslocoPipe,
    LuxonShortDateTimePipe,
    AsyncPipe,
    NgbPopover,
    NgbPaginationModule,
    NgTemplateOutlet,
  ],
})
export class MyTasksComponent extends DefaultComponent implements OnChanges {
  @Input() project?: ProjectDto;
  @Output() continueTask = new EventEmitter<{
    project: ProjectDto;
    task: TaskDto;
  }>();

  protected tasks?: PreparedTask[];
  protected transcript?: string = '';

  protected options = {
    itemsPerPage: 10,
  };

  protected pagination = {
    currentPage: 1,
    collectionSize: 10,
  };
  private api: OctraAPIService = inject(OctraAPIService);
  private alertService: AlertService = inject(AlertService);
  protected authSoreService: AuthenticationStoreService = inject(
    AuthenticationStoreService,
  );
  private alert: AlertService = inject(AlertService);

  ngOnChanges(changes: SimpleChanges) {
    const project = changes['project'];
    if (project?.currentValue) {
      this.listMyPausedTasks();
    }
  }

  listMyPausedTasks() {
    this.subscribe(
      this.api.listMyProcessedTasks(this.project.id, {
        representation: 'interval',
        start: (this.pagination.currentPage - 1) * this.options.itemsPerPage,
        length: this.options.itemsPerPage,
        status: [TaskStatus.paused],
      }),
      {
        next: (result) => {
          this.tasks = result.list?.map((a) => new PreparedTask(this.api, a));
          this.pagination.collectionSize = result.maxCount;
        },
        error: (err) => {
          this.alert.showAlert(
            'danger',
            `${err?.error?.message ?? err?.message}`,
          );
        },
      },
    );
  }

  freeTask(task: PreparedTask) {
    this.subscribe(this.api.freeTask(this.project.id, task.id), {
      next: (task) => {
        this.listMyPausedTasks();
        this.alertService.showAlert(
          'success',
          'Task marked as free for other transcribers.',
        );
      },
      error: (err) => {
        this.alertService.showAlert(
          'danger',
          err?.error?.message ?? err?.message,
        );
      },
    });
  }

  continueTaskClick(task: PreparedTask) {
    this.continueTask.emit({
      project: this.project,
      task: removeProperties(task, ['api']),
    });
  }

  onPageChange(page: number) {
    this.listMyPausedTasks();
  }
}
