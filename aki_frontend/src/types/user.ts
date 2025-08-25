import { Department } from "@/types/department";

export enum UserRoles {
  User = "user",
  Admin = "admin",
}

export type UserProps = {
    id: number;
    name: string;
    username: string;
    role: UserRoles;
    access_token: string;
    refresh_token: string;
    external_id: string | null;
    departments?: Array<Department>
  };

export class User {
  id: number;
  username: string;
  name: string;
  role: UserRoles;
  externalId: string | null;
  departments?: Array<Department> | null;
  accessToken: string | null;
  refreshToken: string | null;

  constructor({ id, username, name, role, access_token, refresh_token, external_id, departments}: UserProps) {
    this.id = id;
    this.username = username;
    this.name = name;
    this.role = role;
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
    this.externalId = external_id;
    this.departments = departments
  }

  get isAdmin() {
    return this.role == UserRoles.Admin;
  }
}

export type UserFormPayload = {
    username: string;
    name: string;
    password?: string | null;
    role: UserRoles.Admin | UserRoles.User;
    external_id?: string | null;
    departments?: Array<Number>;
}

export type UserErrorItem = {
  name?: Array<string>;
  username?: Array<string>;
  password?: Array<string>;
  departments?: Array<string>;
  role?: Array<string>;
  external_id?: Array<string>;
};
