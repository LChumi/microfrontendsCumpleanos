export interface LoginRequest {
  usrId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
