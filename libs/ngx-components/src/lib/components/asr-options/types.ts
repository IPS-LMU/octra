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

export interface ASROptionsTranslations {
  header?: string;
  asrLanguage?: string;
  mausLanguage?: string;
  nothingFound?: string;
  asrProvider?: string;
  accessCode?: string;
  nothingSelected?: string;
}
