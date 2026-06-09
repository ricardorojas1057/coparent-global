import { Role } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  ver: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
};
