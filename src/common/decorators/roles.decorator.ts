// // common/decorators/roles.decorator.ts
// import { SetMetadata } from '@nestjs/common';
// import { UserRole } from '../../users/schemas/user.schema';

// export const ROLES_KEY = 'roles';
// export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// // common/decorators/public.decorator.ts
// import { SetMetadata } from '@nestjs/common';

// export const IS_PUBLIC_KEY = 'isPublic';
// export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);