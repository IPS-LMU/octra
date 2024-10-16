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
        supportEmail: {
          type: 'string',
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
        languages: {
          items: {
            type: 'string',
          },
          type: 'array',
        },
      },
      type: 'object',
      required: ['database', "supportEmail"],
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
  required: ['version', 'api', 'octra'],
};
