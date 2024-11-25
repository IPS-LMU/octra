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
    supportEmail: string;
    login: {
      enabled: boolean;
    };
    showdetails: boolean;
    responsive: {
      enabled: boolean;
      fixedwidth: number;
    };
    plugins?: {
      audioCutter?: {
        enabled: boolean;
      };
      asr?: ASRSettings;
    };
    allowed_browsers: any[];
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

export interface ServiceProvider {
  provider: string;
  basName?: string;
  maxSignalDuration?: number;
  maxSignalSize?: number;
  quotaPerMonth?: number;
  knownIssues?: string;
  usedQuota?: number;
  type: string;
  termsURL: string;
  dataStoragePolicy: string;
  homepageURL: string;
  logoURL: string;
  host: string;
}

export interface ASRSettings {
  enabled: boolean;
  shibbolethURL: string;
  calls: string[];
  services: ServiceProvider[];
  asrInfoURL?: string;
  basConfigURL?: string;
  asrQuotaInfoURL?: string;
}
