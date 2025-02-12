export interface AuthTokenResult {
  sub: string;
  role: string;
  exp: number;
}

export interface IUseToken {
  sub: string;
  role: string;
  isExpired: boolean;
}
