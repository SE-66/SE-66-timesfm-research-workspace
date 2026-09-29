import test from 'node:test';
import assert from 'node:assert/strict';
import { validImage, validPort, validSlug } from '../src/validation.mjs';

test('project slugs are constrained', () => {
  assert.equal(validSlug('hello-world'), true);
  assert.equal(validSlug('Hello'), false);
  assert.equal(validSlug('../root'), false);
});

test('container image references reject shell-like input', () => {
  assert.equal(validImage('nginx:1.28-alpine'), true);
  assert.equal(validImage('ghcr.io/acme/app:v1'), true);
  assert.equal(validImage('nginx;rm -rf /'), false);
});

test('container ports are bounded', () => {
  assert.equal(validPort(3000), true);
  assert.equal(validPort(0), false);
  assert.equal(validPort(70000), false);
});
