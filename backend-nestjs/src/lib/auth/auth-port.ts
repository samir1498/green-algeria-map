export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
}

export interface AuthPort {
  getSessionUser(token: string): Promise<UserSession | null>;
}
