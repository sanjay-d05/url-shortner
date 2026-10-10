export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  refreshTokenHash: string | null;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}
