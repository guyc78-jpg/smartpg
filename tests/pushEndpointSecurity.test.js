import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAllowedPushEndpoint as normalizeDirectEndpoint } from '../base44/functions/sendPushNotification/pushEndpointSecurity.js';
import { normalizeAllowedPushEndpoint as normalizeScheduledEndpoint } from '../base44/functions/sendScheduledReminders/pushEndpointSecurity.js';

const validators = [normalizeDirectEndpoint, normalizeScheduledEndpoint];

test('push endpoint validation accepts known browser push services', () => {
  const endpoints = [
    'https://fcm.googleapis.com/fcm/send/device-token',
    'https://updates.push.services.mozilla.com/wpush/v2/subscription-id',
    'https://web.push.apple.com/QPabcdefghijklmnop',
    'https://db5.notify.windows.com/w/?token=example',
  ];

  for (const validate of validators) {
    for (const endpoint of endpoints) assert.equal(validate(endpoint), endpoint);
  }
});

test('push endpoint validation blocks SSRF, credentials, alternate ports, and lookalike hosts', () => {
  const endpoints = [
    'http://fcm.googleapis.com/fcm/send/device-token',
    'https://127.0.0.1/push',
    'https://169.254.169.254/latest/meta-data',
    'https://user:password@fcm.googleapis.com/push',
    'https://fcm.googleapis.com:8443/push',
    'https://fcm.googleapis.com.evil.example/push',
    'https://evilnotify.windows.com/push',
    'https://example.com/push',
    'https://fcm.googleapis.com\\@127.0.0.1/push',
  ];

  for (const validate of validators) {
    for (const endpoint of endpoints) assert.throws(() => validate(endpoint));
  }
});
