import { getMainViewModel } from './main-view-model';

export function pageNavigatedTo(args) {
  const page = args.object;
  const broker = getMainViewModel();
  page.bindingContext = broker;
  broker.executeTestRun();
}
