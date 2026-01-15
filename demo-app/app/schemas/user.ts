import { Type } from '@warp-drive/core-types/symbols';

export interface User {
  [Type]: 'user';
  id: string | null;
  name: string;
  email: string;
  age: number;
  avatar?: string;
  bio?: string;
}

export const UserSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    {
      name: 'name',
      kind: 'attribute',
      type: null,
    },
    {
      name: 'email',
      kind: 'attribute',
      type: null,
    },
    {
      name: 'age',
      kind: 'attribute',
      type: null,
    },
    {
      name: 'avatar',
      kind: 'attribute',
      type: null,
    },
    {
      name: 'bio',
      kind: 'attribute',
      type: null,
    },
  ],
} as const;