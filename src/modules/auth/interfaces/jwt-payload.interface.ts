// auth/interfaces/jwt-payload.interface.ts
import { UserRole } from '../../user/entities/user.entity';

export interface JwtPayload {
  sub: string; // Subject (user ID)
  username: string;
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}