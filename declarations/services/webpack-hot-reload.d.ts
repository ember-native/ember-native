import Service from '@ember/service';
import RouterService from '@ember/routing/router-service';
export default class WebpackHotReload extends Service {
    container: any;
    router: RouterService;
    constructor(...args: any);
    getLatestChange(obj: any): any;
}
declare module '@ember/service' {
    interface Registry {
        'hot-reload': WebpackHotReload;
    }
}
