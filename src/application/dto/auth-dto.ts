export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUserView {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
}

export interface AuthenticatedUserToken {
  accessToken: string;
  user: AuthenticatedUserView;
}
