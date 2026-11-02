const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const file = path.join(__dirname, '.env');
let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
if (/^ADMIN_PASSWORD_HASH=/m.test(text)) {
    console.log('Dashboard already configured. Existing password and unsubscribe secret kept.');
    process.exit(0);
}
const password = crypto.randomBytes(18).toString('base64url');
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');
text += '\nADMIN_PASSWORD_HASH=' + salt + ':' + hash + '\n';
if (!/^UNSUBSCRIBE_SECRET=/m.test(text)) text += 'UNSUBSCRIBE_SECRET=' + crypto.randomBytes(32).toString('hex') + '\n';
if (!/^PUBLIC_URL=/m.test(text)) text += 'PUBLIC_URL=http://localhost:3000\n';
fs.writeFileSync(file, text, { mode: 0o600 });
console.log('Your dashboard password (save privately):\n' + password + '\n\nOpen http://localhost:3000/admin after starting your server.');
