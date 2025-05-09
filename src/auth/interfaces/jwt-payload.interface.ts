// auth/interfaces/jwt-payload.interface.ts
// import { UserRole } from '../../users/schemas/user.schema';

export interface JwtPayload {
  sub: string; // Subject (user ID)
  username: string;
  email: string;
  // role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}