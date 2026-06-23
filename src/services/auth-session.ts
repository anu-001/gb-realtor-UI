const REFRESH_TOKEN_KEY = "gb_realtor_refresh_token";
let refreshTokenMemory: string | null = null;

function getStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function setRefreshToken(refreshToken: string | null): void {
  refreshTokenMemory = refreshToken;
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    storage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getRefreshToken(): string | null {
  const storage = getStorage();

  if (storage) {
    const stored = storage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      refreshTokenMemory = stored;
      return stored;
    }
  }

  return refreshTokenMemory;
}

export function clearRefreshToken(): void {
  refreshTokenMemory = null;
  const storage = getStorage();
  storage?.removeItem(REFRESH_TOKEN_KEY);
}
