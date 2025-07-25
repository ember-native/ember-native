import { setApplication } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

import Application from 'docs-app/app';
import config from 'docs-app/config/environment';
import type { Page } from '../types/page';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

QUnit.config.urlConfig.push({
  id: 'debugA11yAudit',
  label: 'Log a11y violations',
});

// Use void operator to explicitly mark the promise as ignored
void (async function loadManifest() {
  const response = await fetch('/kolay-manifest/manifest.json');
  const json = (await response.json()) as { groups: { list: Page[] }[] };
  const pages = json.groups[0]?.list;

  // The accessibility page deliberately
  // has violations for demonstration
  (window as unknown as { __pages__?: Page[] }).__pages__ = pages?.filter(
    (page) => {
      return typeof page.path === 'string' && !page.path.includes('accessibility');
    }
  );
  start();
})();
