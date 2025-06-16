import { JSONSchema4 } from 'json-schema';

export const AppConfigSchema: JSONSchema4 = {
  $id: '2.1.0',
  required: ['version', 'octra'],
  type: 'object',
  properties: {
    version: {
      type: 'string',
      description:
        'The version shows which version of OCTRA is compatible with this configuration.',
    },
    api: {
      required: ['url', 'appToken'],
      properties: {
        url: {
          type: 'string',
          description: 'URL to the Octra-Backend API',
        },
        appToken: {
          type: 'string',
          description: 'Apptoken offered by the Octra-Backend.',
        },
      },
      type: 'object',
    },
    octra: {
      required: ['database', 'supportEmail', 'languages'],
      properties: {
        database: {
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description:
                "Set the name of the local database that is found in the user's browser. This attribute must be set.",
            },
          },
          type: 'object',
        },
        supportEmail: {
          type: 'string',
          description: 'Email address visible if the server is offline.',
        },
        login: {
          properties: {
            enabled: {
              type: 'boolean',
              description:
                'Defines if users are allowed to use the Online Mode.',
            },
          },
          type: 'object',
        },
        languages: {
          items: {
            type: 'string',
          },
          type: 'array',
          description:
            'If you translated OCTRA to other languages, you can define these in this array. For each language there has to be one octra_[lang].json',
        },
        plugins: {
          type: 'object',
          properties: {
            asr: {
              type: 'object',
              required: ['enabled', 'calls', 'services'],
              properties: {
                enabled: {
                  type: 'boolean',
                },
                calls: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                services: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      provider: {
                        type: 'string',
                      },
                      basName: {
                        type: 'string',
                      },
                      type: {
                        type: 'string',
                      },
                      termsURL: {
                        type: 'string',
                      },
                      dataStoragePolicy: {
                        type: 'string',
                      },
                      homepageURL: {
                        type: 'string',
                      },
                      logoURL: {
                        type: 'string',
                      },
                      host: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        audioExamples: {
          type: 'array',
          items: {
            required: ['language', 'url'],
            type: 'object',
            properties: {
              language: {
                type: 'string',
                pattern: '[a-z]{2}',
              },
              url: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
            },
          },
        },
        inactivityNotice: {
          type: 'object',
          properties: {
            showAfter: {
              type: 'number',
              description:
                'Set the time in minutes after that a notice because of inactivity is shown.',
            },
          },
        },
        maintenanceNotification: {
          type: 'object',
          description:
            'Set the time after that a notice because of inactivity is shown.',
          required: ['active', 'apiURL'],
          properties: {
            active: {
              type: 'string',
              enum: ['active', 'inactive'],
            },
            apiURL: {
              type: 'string',
              pattern: '^https?://',
            },
          },
        },
        tracking: {
          type: 'object',
          properties: {
            active: {
              type: 'string',
              enum: ['matomo', ''],
            },
            matomo: {
              type: 'object',
              description: 'Settings for matomo',
              properties: {
                host: {
                  type: 'string',
                },
                siteID: {
                  type: 'number',
                },
              },
            },
          },
        },
        oldVersion: {
          type: 'object',
          required: ['url'],
          description:
            'If set Octra shows a link to a previous version on the login page.',
          properties: {
            url: {
              type: 'string',
            },
          },
        },
      },
      type: 'object',
    },
    octraBackend: {
      required: ['enabled', 'url'],
      type: 'object',
      description: 'Defines if the OCB shall be integrated into OCTRA.',
      properties: {
        enabled: {
          type: 'boolean',
        },
        url: {
          type: 'string',
        },
      },
    },
  },
};
