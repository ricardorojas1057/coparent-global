export const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://coparent-argentina-api.vercel.app';

export async function publicRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${publicApiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new Error(message ?? 'No pudimos completar la operacion.');
  }
  return body as T;
}
