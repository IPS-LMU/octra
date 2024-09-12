import {
  AccountLoginMethod,
  AccountRole,
  CurrentAccountDto,
  ProjectDto,
  ProjectVisibility,
  TaskDto,
  TaskInputOutputDto,
  TaskStatus,
} from '@octra/api-types';
import { AnnotationActions } from '../store/login-mode/annotation/annotation.actions';
import { ApplicationActions } from '../store/application/application.actions';
import { IDBActions } from '../store/idb/idb.actions';
import { APIActions } from '../store/api';
import { LoginModeActions } from '../store/login-mode';
import { ASRActions } from '../store/asr/asr.actions';
import { UserActions } from '../store/user/user.actions';
import { AppInfo } from '../../app.info';

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
        draft: 12,
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
            draft: 12,
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
    loginmethod: AccountLoginMethod.local,
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

export const isValidAnnotation = (io: TaskInputOutputDto, audiofile: any) => {
  for (const converter of AppInfo.converters) {
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

  return undefined;
};

export function isIgnoredAction(type: string) {
  // IMPORTANT: MAKE SURE TO ADD ".type"
  return (
    (
      [
        AnnotationActions.loadAudio.progress.type,
        AnnotationActions.addLog.do.type,
        IDBActions.loadConsoleEntries.success.type,
        IDBActions.loadOptions.success.type,
        ApplicationActions.loadSettings.success.type,
        APIActions.init.do.type,
        IDBActions.loadLogs.success.type,
        LoginModeActions.changeComment.do.type,
        AnnotationActions.setSavingNeeded.do.type,
        AnnotationActions.overwriteTranscript.do.type,
        ASRActions.processQueueItem.do.type,
        ApplicationActions.loadASRSettings.do.type,
        ApplicationActions.loadASRSettings.success.type,
        IDBActions.saveUserProfile.success.type,
        UserActions.setUserProfile.type,
      ] as string[]
    ).includes(type) || isIgnoredConsoleAction(type)
  );
}

export function isIgnoredConsoleAction(type: string) {
  // IMPORTANT: MAKE SURE TO ADD ".type"
  return (
    [
      ApplicationActions.setConsoleEntries.type,
      IDBActions.saveConsoleEntries.success.type,
      IDBActions.saveConsoleEntries.fail.type,
    ] as string[]
  ).includes(type);
}

export function findCompatibleFileFromIO<T>(
  task: TaskDto,
  type: 'audio' | 'transcript',
  validation: (io: TaskInputOutputDto) => T | undefined
): T | undefined {
  let i = 0;
  let inputs = [...task.inputs];
  let outputs = [...task.outputs];

  const lookForValidFile = (filteredIO: TaskInputOutputDto[]) => {
    for (const io of filteredIO) {
      const result = validation(io);
      if (result) {
        return result;
      }
    }
    return undefined;
  };

  while (inputs.length > 0 || outputs.length > 0) {
    const filteredInputs = inputs.filter((a) => a.chain_position === i);
    inputs = inputs.filter((a) => !filteredInputs.find((b) => b.id === a.id));
    const filteredOutputs = outputs.filter((a) => a.chain_position === i);
    outputs = outputs.filter(
      (a) => !filteredOutputs.find((b) => b.id === a.id)
    );
    let result: T | undefined;

    if (i === 0) {
      if (type === 'transcript') {
        result = lookForValidFile(filteredOutputs);
        if (result) {
          return result;
        }
      }

      result = lookForValidFile(filteredInputs);
      if (result) {
        return result;
      }
    } else {
      // apply "zick-zack algorithm"
      // first look for outputs, then inputs
      result = lookForValidFile(filteredOutputs);
      if (result) {
        return result;
      }

      result = lookForValidFile(filteredInputs);
      if (result) {
        return result;
      }
    }
    i--;
  }

  return undefined;
}
