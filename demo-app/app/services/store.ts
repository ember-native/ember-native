import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';
import { UserSchema } from '../schemas/user';

export default class StoreService extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [UserSchema],
}) {}

declare module '@ember/service' {
  interface Registry {
    store: StoreService;
  }
}
