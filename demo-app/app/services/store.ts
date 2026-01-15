import { useLegacyStore } from '@warp-drive/core/store';
import { JSONAPICache } from '@warp-drive/json-api';
import { UserSchema } from '../schemas/user';

export default class StoreService extends useLegacyStore({
  legacyRequests: true,
  cache: JSONAPICache,
  schemas: [UserSchema],
  handlers: []
}) {}

declare module '@ember/service' {
  interface Registry {
    store: StoreService;
  }
}