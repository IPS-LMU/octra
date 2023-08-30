import { AccountLoginMethod } from '@octra/api-types';

export interface AppSettings {
  version: string;
  api: {
    url: string;
    appToken: string;
    authentications?: AccountLoginMethod[];
    passwordResetEnabled?: boolean;
    registrationsEnabled?: boolean;
  };
  octra: {
    database: {
      name: string;
    };
    login: {
      enabled: boolean;
    };
    showdetails: boolean;
    responsive: {
      enabled: boolean;
      fixedwidth: number;
    };
    bugreport: {
      enabled: boolean;
      name: string;
      auth_token: string;
      url: string;
    };
    plugins?: {
      audioCutter?: {
        enabled: boolean;
      };
      asr?: ASRSettings;
    };
    allowed_browsers: any[];
    allowed_projects: {
      name: string;
      password: string;
    }[];
    languages: string[];
    tracking: {
      active: string;
      matomo: {
        host: string;
        siteID: number;
      };
    };
    audioExamples: {
      language: string;
      url: string;
      description: string;
    }[];
    inactivityNotice: {
      showAfter: number;
    };
    maintenanceNotification: {
      active: string;
      apiURL: string;
    };
  };
  octraBackend?: {
    enabled: boolean;
    url: string;
  };
}

export interface ASRLanguage {
  code: string;
  name: string;
  asr: string;
  state: string;
  host: string;
}

export interface ASRService {
  provider: string;
  basName?: string;
  maxSignalDuration?: number;
  maxSignalSize?: number;
  quotaPerMonth?: number;
  knownIssues?: string;
  type: string;
  termsURL: string;
  dataStoragePolicy: string;
  homepageURL: string;
  logoURL: string;
}

export interface ASRSettings {
  enabled: boolean;
  shibbolethURL: string;
  calls: string[];
  services: ASRService[];
  languages: ASRLanguage[];
  asrInfoURL?: string;
}
