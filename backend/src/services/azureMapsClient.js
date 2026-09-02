import { config } from '../config/env.js';
import { AzureMapsError } from '../errors/AppError.js';

export async function azureMapsGet(path, { apiVersion, params = {} }) {
  const url = new URL(path, config.baseUrl);
  url.searchParams.set('api-version', apiVersion);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  // Appended last, and never included in thrown/logged messages (those carry `path` only).
  url.searchParams.set('subscription-key', config.subscriptionKey);

  let response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(config.httpTimeoutMs),
    });
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError';
    throw new AzureMapsError({
      status: timedOut ? 504 : 502,
      path,
      upstreamCode: cause?.name,
      upstreamMessage: timedOut ? `Timed out after ${config.httpTimeoutMs}ms` : 'Network request failed',
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new AzureMapsError({
      status: response.status,
      path,
      upstreamCode: body?.error?.code,
      upstreamMessage: body?.error?.message,
    });
  }

  return response.json();
}
