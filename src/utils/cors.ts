export const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export function corsResponse(
  body: string | BodyInit | null,
  options?: ResponseInit
): Response {
  return new Response(body, {
    ...options,
    headers: { ...CORS_HEADERS, ...options?.headers },
  })
}

export function corsJson(data: unknown, options?: ResponseInit): Response {
  return Response.json(data, {
    ...options,
    headers: { ...CORS_HEADERS, ...options?.headers },
  })
}
