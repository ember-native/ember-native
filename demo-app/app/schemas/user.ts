import { Type } from '@warp-drive/core/types/symbols';
import type { PolarisResourceSchema } from '@warp-drive/core/types/schema/fields';

export interface User {
  [Type]: 'user';
  id: string | null;
  name: string;
  email: string;
  age: number;
  avatar?: string;
  bio?: string;
}

export const UserSchema: PolarisResourceSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    {
      name: 'name',
      kind: 'field',
      type: null,
    },
    {
      name: 'email',
      kind: 'field',
      type: null,
    },
    {
      name: 'age',
      kind: 'field',
      type: null,
    },
    {
      name: 'avatar',
      kind: 'field',
      type: null,
    },
    {
      name: 'bio',
      kind: 'field',
      type: null,
    },
  ],
} as const;