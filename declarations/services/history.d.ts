import Service from '@ember/service';
import type NativeRouter from './native-router.ts';
import type Router from '@ember/routing/router';
import type { Transition } from 'router_js';
export default class HistoryService extends Service {
    router: Router;
    nativeRouter: NativeRouter;
    stack: Transition[];
    setup(): void;
    activityBackPressed: (args: {
        cancel: boolean;
    }) => void;
    back: () => boolean;
}
