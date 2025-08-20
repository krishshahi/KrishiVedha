const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agriculture App API',
      version: '1.0.0',
      description: 'A comprehensive API for managing farms, crops, activities, and community features for agricultural applications',
      contact: {
        name: 'Agriculture App Support',
        email: 'support@agricultureapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.agricultureapp.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                phoneNumber: { type: 'string' },
                address: { type: 'string' },
                profilePicture: { type: 'string' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Farm: {
          type: 'object',
          required: ['name', 'location', 'owner'],
          properties: {
            id: {
              type: 'string',
              description: 'Farm ID'
            },
            name: {
              type: 'string',
              description: 'Farm name'
            },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Point'] },
                    coordinates: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2
                    }
                  }
                }
              }
            },
            size: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                unit: { type: 'string', enum: ['acres', 'hectares', 'square_meters'] }
              }
            },
            owner: {
              type: 'string',
              description: 'Owner user ID'
            },
            farmType: {
              type: 'string',
              enum: ['crop', 'livestock', 'mixed']
            },
            crops: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  variety: { type: 'string' }
                }
              }
            }
          }
        },
        Crop: {
          type: 'object',
          required: ['name', 'farm', 'owner', 'plantingDate'],
          properties: {
            id: {
              type: 'string',
              description: 'Crop ID'
            },
            name: {
              type: 'string',
              description: 'Crop name'
            },
            variety: {
              type: 'string',
              description: 'Crop variety'
            },
            farm: {
              type: 'string',
              description: 'Farm ID'
            },
            owner: {
              type: 'string',
              description: 'Owner user ID'
            },
            plantingDate: {
              type: 'string',
              format: 'date'
            },
            expectedHarvestDate: {
              type: 'string',
              format: 'date'
            },
            actualHarvestDate: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['planned', 'planted', 'growing', 'harvested', 'failed']
            },
            growthStage: {
              type: 'string',
              enum: ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'harvest']
            },
            area: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                unit: { type: 'string', enum: ['acres', 'hectares', 'square_meters'] }
              }
            },
            activities: {
              type: 'array',
              items: { $ref: '#/components/schemas/Activity' }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  caption: { type: 'string' },
                  stage: { type: 'string' },
                  uploadDate: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        Activity: {
          type: 'object',
          required: ['type', 'title', 'date'],
          properties: {
            id: {
              type: 'string',
              description: 'Activity ID'
            },
            type: {
              type: 'string',
              enum: ['planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'harvesting', 'stage_change', 'observation', 'other']
            },
            title: {
              type: 'string',
              description: 'Activity title'
            },
            description: {
              type: 'string',
              description: 'Activity description'
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            metadata: {
              type: 'object',
              description: 'Additional activity-specific data'
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of image URLs'
            },
            createdBy: {
              type: 'string',
              description: 'User ID who created the activity'
            }
          }
        },
        CommunityPost: {
          type: 'object',
          required: ['title', 'content', 'category', 'author'],
          properties: {
            id: {
              type: 'string',
              description: 'Post ID'
            },
            title: {
              type: 'string',
              description: 'Post title'
            },
            content: {
              type: 'string',
              description: 'Post content'
            },
            category: {
              type: 'string',
              enum: ['general', 'crops', 'pests', 'farming', 'weather', 'technology', 'question', 'advice']
            },
            author: {
              type: 'string',
              description: 'Author user ID'
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            likesCount: {
              type: 'number',
              description: 'Number of likes'
            },
            commentsCount: {
              type: 'number',
              description: 'Number of comments'
            },
            isPinned: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: { type: 'object' }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        TooManyRequestsError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name'],
            default: '-createdAt'
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Farms',
        description: 'Farm management'
      },
      {
        name: 'Crops',
        description: 'Crop management'
      },
      {
        name: 'Activities',
        description: 'Crop activity tracking'
      },
      {
        name: 'Images',
        description: 'Image upload and management'
      },
      {
        name: 'Community',
        description: 'Community posts and interactions'
      },
      {
        name: 'Knowledge',
        description: 'Knowledge base and learning resources'
      },
      {
        name: 'Weather',
        description: 'Weather data and forecasts'
      }
    ]
  },
  apis: [
    './server.js',
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar {
      background-color: #4CAF50;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
  `,
  customSiteTitle: 'Agriculture App API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
