import type ApplicationClass from '@ember/application';
export declare function createNativeApplication(Application: typeof ApplicationClass, env: {
    modulePrefix: string;
    APP: {
        version: string;
    };
}): ApplicationClass;
