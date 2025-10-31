import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Padel Court Booking API',
      version: '1.0.0',
      description: 'API documentation for the Padel Court Booking System',
      contact: {
        name: 'API Support',
        email: 'support@padelcourt.com',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/docs/*.ts'
  ], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);