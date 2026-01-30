import ApplicationInstance from '@ember/application/instance';
declare const Initializer: {
    name: string;
    after: any[];
    initialize(application: ApplicationInstance): void;
};
export default Initializer;
