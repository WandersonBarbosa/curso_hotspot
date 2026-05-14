import swaggerJSDoc from "swagger-jsdoc";
import { API_PREFIX } from "@hotspot/shared";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Hotspot SaaS API",
      version: "1.0.0",
      description: "API multiempresa para painel Hotspot MikroTik, Atlaz e PIX.",
    },
    servers: [{ url: API_PREFIX }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/**/*.ts", "./dist/routes/**/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
