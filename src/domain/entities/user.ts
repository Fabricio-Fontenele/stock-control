export const USER_ROLE = {
  ADMIN: "admin",
  EMPLOYEE: "employee"
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const isAdmin = (user: Pick<User, "role">): boolean => user.role === USER_ROLE.ADMIN;

export const isUserActive = (user: Pick<User, "status">): boolean =>
  user.status === USER_STATUS.ACTIVE;
