import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Photo API Documentation',
      version: '1.0.0',
      description: 'Documentation for Photo API',
    },
  },
  apis: ['*.json'], 
};

const specs = swaggerJSDoc(options);
export default specs;