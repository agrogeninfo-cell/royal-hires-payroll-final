import { readFileSync, writeFileSync } from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest;
try {
  manifest = readFileSync(manifestPath, 'utf8');
} catch (error) {
  console.error(`Cannot read generated Android manifest at ${manifestPath}.`, error);
  process.exit(1);
}

const scheme = 'lk.royalhires.payroll';
if (manifest.includes(`android:scheme="${scheme}"`) && manifest.includes('android:host="auth"')) {
  console.log('Royal Pay OAuth deep link is already registered.');
  process.exit(0);
}

const activityClose = manifest.indexOf('</activity>');
if (activityClose < 0) {
  console.error('No Android activity closing tag found; refusing to modify the manifest.');
  process.exit(1);
}

const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${scheme}" android:host="auth" android:path="/callback" />
            </intent-filter>
`;

manifest = manifest.slice(0, activityClose) + intentFilter + manifest.slice(activityClose);
writeFileSync(manifestPath, manifest, 'utf8');
console.log('Registered Royal Pay OAuth deep link: ' + scheme + '://auth/callback');
