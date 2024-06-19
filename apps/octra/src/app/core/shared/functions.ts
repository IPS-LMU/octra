import {
  AccountRole,
  CurrentAccountDto,
  ProjectDto,
  ProjectVisibility,
  TaskDto,
  TaskInputOutputDto,
  TaskStatus,
} from '@octra/api-types';
import { Converter } from '@octra/annotation';
import { OAudiofile } from '@octra/media';

export function createSampleProjectDto(
  projectID: string,
  dto?: Partial<ProjectDto>
): ProjectDto {
  return {
    id: projectID,
    name: 'demo project',
    shortname: 'demo',
    roles: [],
    statistics: {
      status: {
        free: 1234567,
        paused: 34,
        busy: 12,
        finished: 30,
        postponed: 23,
        failed: 15,
      },
      tasks: [
        {
          type: 'annotation',
          status: {
            free: 1234567,
            paused: 34,
            busy: 12,
            finished: 30,
            postponed: 23,
            failed: 15,
          },
        },
      ],
    },
    description: 'This project shows you how octra works',
    active: true,
    visibility: ProjectVisibility.public,
    startdate: new Date().toISOString(),
    enddate: new Date().toISOString(),
    creationdate: new Date().toISOString(),
    updatedate: new Date().toISOString(),
    ...dto,
  };
}

export function createSampleTask(
  taskID: string,
  inputs: TaskInputOutputDto[],
  outputs: TaskInputOutputDto[],
  projectConfig: any,
  functions: string,
  guidelines: any[],
  dto?: Partial<TaskDto>
): TaskDto {
  return {
    id: taskID,
    inputs,
    outputs,
    status: TaskStatus.free,
    creationdate: new Date().toISOString(),
    updatedate: new Date().toISOString(),
    tool_configuration: {
      id: '345',
      tool_id: 565,
      name: 'localConfig',
      task_type: {
        name: 'annotation',
        style: {},
      },
      value: projectConfig,
      assets: [
        {
          id: '1',
          name: 'functions',
          filename: 'functions.js',
          mime_type: 'application/javascript',
          content: functions,
        },
        ...guidelines
          .filter((c) => c !== undefined)
          .map((c, i) => ({
            id: (i + 2).toString(),
            name: `guidelines`,
            filename: `guidelines_${c?.language}.json`,
            mime_type: 'application/json',
            content: c?.json,
          })),
      ],
    },
    ...dto,
  };
}

export function createSampleUser(): CurrentAccountDto {
  return {
    id: '12345',
    username: 'demoUser',
    projectRoles: [],
    systemRole: {
      label: AccountRole.user,
      i18n: {},
      badge: 'orange',
    },
    email: 'demo-user@example.com',
    email_verified: true,
    first_name: 'John',
    last_name: 'Doe',
    last_login: new Date().toISOString(),
    locale: 'en-EN',
    timezone: 'Europe/Berlin',
  };
}

export function getAnnotationFromTask(
  task: TaskDto,
  converters: Converter[],
  audiofileName: string,
  audiofile: OAudiofile
): any | undefined {
  const getValidAnnotation = (ios: TaskInputOutputDto[]) => {
    for (const converter of converters) {
      for (const io of ios) {
        if (
          !io.fileType ||
          (!io.fileType.includes('audio') &&
            !io.fileType.includes('video') &&
            !io.fileType.includes('image'))
        ) {
          const result = converter.import(
            {
              name: io.filename,
              content: io.content,
              type: io.fileType!,
              encoding: 'utf-8',
            },
            audiofile
          );

          if (result?.annotjson) {
            return result.annotjson;
          } else if (
            converter.name === 'AnnotJSON' &&
            /_annot\.json$/g.exec(io.filename) !== null
          ) {
            throw new Error(`Can't read AnnotJSON file: ${result.error}`);
          }
        }
      }
    }

    return undefined;
  };

  // check if this task has given annotation in its outputs field.
  let found = getValidAnnotation(task.outputs);
  if (!found) {
    found = getValidAnnotation(task.inputs);
  }
  if (!found && task.use_outputs_from_task) {
    found = getValidAnnotation((task.use_outputs_from_task as any).outputs);
  }

  return found;
}
