import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountDestination, registrationDestination } from '../src/lib/account-role.ts';
test('staff registration intent never grants staff access', () => {
  assert.equal(registrationDestination({}, true), '/staff');
  assert.equal(registrationDestination({}, false), '/app');
  assert.equal(accountDestination({}), '/app');
});
test('approved roles take precedence and staff must complete MFA', () => {
  assert.equal(registrationDestination({staffRole:'admin', isStaff:false}, true), '/auth/security');
  assert.equal(registrationDestination({staffRole:'admin', isStaff:true}, true), '/admin');
  assert.equal(registrationDestination({staffRole:'consultant', isStaff:true}, true), '/admin/candidates');
  assert.equal(registrationDestination({accountRole:'employer'}, true), '/employer');
  assert.equal(accountDestination({staffRole:'admin', isStaff:false}, '/admin'), '/auth/security');
});

test('staff intent persists on sign-in but never grants privileges or bypasses MFA', () => {
  assert.equal(accountDestination({staffRequested:true}, '/app'), '/staff');
  assert.equal(accountDestination({staffRequested:true,staffRole:'admin',isStaff:false}), '/auth/security');
  assert.equal(accountDestination({staffRequested:true,staffRole:'admin',isStaff:true}), '/admin');
});
