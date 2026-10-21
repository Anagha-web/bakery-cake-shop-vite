// Turns Supabase / network errors into messages staff can act on.

type ErrorLike = { code?: string; message?: string; details?: string | null; name?: string; status?: number }

const constraintMessages: Record<string, string> = {
  products_slug_key: 'Another product already uses this URL slug. Choose a different one.',
  categories_slug_key: 'Another category already uses this URL slug. Choose a different one.',
  categories_name_key: 'A category with this name already exists.',
  products_price_check: 'Price must be zero or more.',
  products_category_id_fkey: 'That category no longer exists. Reload and choose another.',
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that. Ask an admin if you need access.") {
    super(message)
    this.name = 'PermissionError'
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof PermissionError) return error.message
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return "Couldn't reach the server. Check your internet connection and try again."
  }

  const e = (typeof error === 'object' && error !== null ? error : { message: String(error) }) as ErrorLike
  const text = `${e.message ?? ''} ${e.details ?? ''}`

  for (const [constraint, message] of Object.entries(constraintMessages)) {
    if (text.includes(constraint)) return message
  }

  switch (e.code) {
    case '23505':
      return 'That value is already in use. Choose a different one.'
    case '23514':
      return 'One of the values is outside the allowed range. Check the form and try again.'
    case '23503':
      return 'This refers to a record that no longer exists. Reload the page and try again.'
    case '42501':
      return "You don't have permission to do that. Ask an admin if you need access."
    case 'PGRST116':
      return 'This record was not found. It may have been removed.'
    case 'PGRST301':
    case 'PGRST303':
      return 'Your session has expired. Sign in again.'
    case 'invalid_credentials':
      return 'Incorrect email or password.'
    case 'email_not_confirmed':
      return 'This email address has not been confirmed yet.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
  }

  if (/invalid login credentials/i.test(text)) return 'Incorrect email or password.'
  if (/failed to fetch|networkerror|load failed/i.test(text)) {
    return "Couldn't reach the server. Check your internet connection and try again."
  }
  return e.message?.trim() || 'Something went wrong. Please try again.'
}
