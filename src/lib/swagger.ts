import { createSwaggerSpec } from "next-swagger-doc"

export const swaggerConfig = {
  apiFolder: "src/pages/api",
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Scoreboard API",
      version: "1.0",
      description: "API documentation for the Scoreboard application",
    },
    security: [],
  },
}

export const getApiDocs = async () => {
  const spec = createSwaggerSpec(swaggerConfig)
  return spec
}
