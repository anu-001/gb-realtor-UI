let refreshTokenMemory: string | null = null;

export function setRefreshToken(refreshToken: string | null): void {
  refreshTokenMemory = refreshToken;
}

export function getRefreshToken(): string | null {
  return refreshTokenMemory;
}

export function clearRefreshToken(): void {
  refreshTokenMemory = null;
}
