export type Callback = { code: string; state: string } | { error: string };

export function parseCallback(search: string): Callback | null {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) {
    const description = params.get('error_description');
    return { error: description ? `${error}: ${description}` : error };
  }
  const code = params.get('code');
  const state = params.get('state');
  return code && state ? { code, state } : null;
}
