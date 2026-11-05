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
  assert.equal(uses.length, 3);
  for (const action of uses) assert.match(action, /@[0-9a-f]{40}$/, action);
});

test('checkout does not keep the token for later steps', () => {
  assert.match(workflow, /persist-credentials: false/);
});

test('deployments run one at a time', () => {
  assert.match(workflow, /concurrency:\s*\n\s+group: pages/);
});
