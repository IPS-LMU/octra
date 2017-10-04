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
    bugreport: {
      enabled: boolean,
      name: string,
      auth_token: string,
      url: string
    },
    allowed_browsers: any[],
    languages: string[]
  };
}
