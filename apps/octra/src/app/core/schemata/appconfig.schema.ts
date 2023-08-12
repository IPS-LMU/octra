export const AppConfigSchema = {
  properties: {
    version: {
      type: 'string',
    },
    api: {
      required: ['url', 'appToken'],
      properties: {
        url: {
          type: 'string',
        },
        appToken: {
          type: 'string',
        },
      },
      type: 'object',
    },
    octra: {
      properties: {
        database: {
          properties: {
            name: {
              type: 'string',
            },
          },
          type: 'object',
          required: ['name'],
        },
        login: {
          properties: {
            enabled: {
              type: 'boolean',
            },
          },
          type: 'object',
        },
        showdetails: {
          type: 'boolean',
        },
        responsive: {
          $id: '/properties/octra/responsive',
          properties: {
            enabled: {
              type: 'boolean',
            },
            fixedwidth: {
              type: 'number',
            },
          },
          type: 'object',
        },
        bugreport: {
          properties: {
            enabled: {
              type: 'boolean',
            },
            name: {
              type: 'string',
            },
            auth_token: {
              type: 'string',
            },
            url: {
              type: 'string',
            },
          },
          type: 'object',
        },
        allowed_browsers: {
          items: {
            properties: {
              name: {
                type: 'string',
              },
              version: {
                type: 'string',
              },
            },
            type: 'object',
          },
          type: 'array',
        },
        allowed_projects: {
          items: {
            properties: {
              name: {
                type: 'string',
              },
            },
            type: 'object',
          },
          type: 'array',
        },
        languages: {
          items: {
            type: 'string',
          },
          type: 'array',
        },
      },
      type: 'object',
      required: ['database'],
    },
    octraBackend: {
      required: ['enabled', 'url'],
      type: 'object',
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
  type: 'object',
  required: ['version', 'api', 'octra']
};
