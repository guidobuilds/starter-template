export type ApiError = {
  code: string
  message: string
  details?: unknown
}

export const errorResponse = (
  code: string,
  message: string,
  details?: unknown,
): ApiError => ({ code, message, details })
