export interface AppSettings {
  version: string;
  audio_server: {
    url: string
  };
  octra: {
    database: {
      name: string
    },
    login: {
      enabled: boolean
    },
    showdetails: boolean,
    responsive: {
      enabled: boolean,
      fixedwidth: number
    },
    allowed_browsers: any[],
    languages: string[]
  };
}
