export const LoggingSchema = {
  'properties': {
    'version': {
      'type': 'string'
    },
    'encoding': {
      'type': 'string'
    },
    'projectname': {
      'type': 'string'
    },
    "logs": {
      "items": {
        "type": "object",
        "properties": {
          "timestamp": {
            "type": "integer"
          },
          "type": {
            "type": "string"
          },
          "target": {
            "type": "string"
          },
          "value": {
            "type": [
              "string",
              "integer",
              "object"
            ]
          },
          "playpos": {
            "type": "integer"
          },
          "caretpos": {
            "type": "integer"
          }
        }
      },
      "type": "array"
    },
    "additionalProperties": false
  }
}
