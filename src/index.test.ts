import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as sdk from './index.ts';

const websiteId = '6f1c7c8e-5d3b-4f5a-9d1e-2b6f0c9a7e41';
const clientKey = 'cw_test_client_key';

interface ScriptStub {
  dataset: Record<string, string>;
  defer?: boolean;
  id?: string;
  src?: string;
}

/** The slice of the DOM `initEntrolytics` touches; returns the script elements it appended. */
function stubDom(): ScriptStub[] {
  const appended: ScriptStub[] = [];
  const document = {
    createElement: (): ScriptStub => ({ dataset: {} }),
    getElementById: () => null,
    head: { appendChild: (script: ScriptStub) => appended.push(script) },
  };
  Object.assign(globalThis, { document, window: { document } });
  return appended;
}

// One test: initEntrolytics initializes once per module, so the failure has to come first.
test('initEntrolytics requires a client key and hands it to the tracker script', () => {
  const appended = stubDom();

  assert.throws(() => sdk.initEntrolytics({ websiteId }), /clientKey is required/);
  assert.equal(appended.length, 0);

  sdk.initEntrolytics({ clientKey, host: 'https://api.example.test/', websiteId });

  assert.equal(appended.length, 1);
  const [script] = appended;
  assert.equal(script?.src, 'https://api.example.test/script.js');
  assert.equal(script?.dataset.websiteId, websiteId);
  assert.equal(script?.dataset.clientKey, clientKey);
});

test('the SDK-side Web Vitals sender is gone', () => {
  assert.equal('trackVital' in sdk, false);
  assert.equal('initWebVitals' in sdk, false);
});
