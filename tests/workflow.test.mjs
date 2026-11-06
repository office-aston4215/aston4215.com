import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const deployJob = workflow.slice(workflow.indexOf('\n  deploy:'));
const beforeDeploy = workflow.slice(0, workflow.indexOf('\n  deploy:'));

test('only the deploy job can write to Pages', () => {
  assert.ok(!/pages: write|id-token: write/.test(beforeDeploy));
  assert.match(deployJob, /pages: write/);
  assert.match(deployJob, /id-token: write/);
});

test('actions are pinned to full commit hashes', () => {
  const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  assert.equal(uses.length, 4);
  for (const action of uses) assert.match(action, /@[0-9a-f]{40}$/, action);
});

test('checkout does not keep the token for later steps', () => {
  assert.match(workflow, /persist-credentials: false/);
});

test('deployments run one at a time', () => {
  assert.match(workflow, /concurrency:\s*\n\s+group: pages/);
});

test('the build is tested and checked in browsers before it is packaged', () => {
  const steps = ['npm run build', 'npm test', 'scripts/browser-check.cjs', 'actions/upload-pages-artifact'];
  const positions = steps.map((step) => beforeDeploy.indexOf(step));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(deployJob, /needs: build/);
  assert.ok(!workflow.includes('withastro/action'), 'a second build would deploy files that were not checked');
});

test('Chromium, Firefox and WebKit are all checked, from a pinned Playwright', () => {
  assert.match(beforeDeploy, /install --with-deps chromium firefox webkit/);
  assert.match(beforeDeploy, /SKIP_BROWSERS: edge/);
  assert.match(beforeDeploy, /playwright@\d+\.\d+\.\d+/);
});

test('every branch is checked but only main deploys', () => {
  assert.ok(!/push:\s*\n\s+branches:/.test(workflow), 'pushes must not be limited to main');
  assert.match(deployJob, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(beforeDeploy, /if: github\.ref == 'refs\/heads\/main'\s*\n\s+uses: actions\/upload-pages-artifact/);
});

test('browsers check the CV page too', () => {
  assert.match(beforeDeploy, /PAGES: .*\/cv\//);
});
