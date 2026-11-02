const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

module.exports = function mountNewsletter(app, transporter, options = {}) {
    const root = options.root || __dirname;
    const env = options.env || process.env;
    const base = new URL(env.PUBLIC_URL || 'http://localhost:3000');
    if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Invalid PUBLIC_URL');
    if (!env.ADMIN_PASSWORD_HASH || !env.UNSUBSCRIBE_SECRET) throw new Error('Run node setup-newsletter.cjs first.');
    const sessions = new Map();
    const attempts = new Map();
    const drafts = new Map();
    let busy = false;
    let queue = Promise.resolve();
    const statePath = path.join(root, 'newsletter-data.json');
    const readState = async () => {
        try { return JSON.parse(await fs.readFile(statePath, 'utf8')); }
        catch (e) { if (e.code === 'ENOENT') return { blocked: [], campaigns: [] }; throw e; }
    };
    const update = fn => {
        const work = queue.then(async () => {
            const state = await readState();
            const result = await fn(state);
            await fs.writeFile(statePath + '.tmp', JSON.stringify(state, null, 2));
            await fs.rename(statePath + '.tmp', statePath);
            return result;
        });
        queue = work.catch(() => {});
        return work;
    };
    const ready = update(s => {
        for (const c of s.campaigns) if (c.status === 'sending') {
            c.status = 'interrupted';
            for (const r of c.recipients) if (r.status === 'sending') r.status = 'unknown';
        }
    });
    const handle = fn => async (req, res, next) => {
        try { await ready; await fn(req, res); } catch (e) { next(e); }
    };
    const token = email => crypto.createHmac('sha256', env.UNSUBSCRIBE_SECRET).update(email).digest('hex');
    const equal = (a, b) => {
        const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || ''));
        return x.length === y.length && crypto.timingSafeEqual(x, y);
    };
    const subscribers = async () => {
        let rows;
        try { rows = JSON.parse(await fs.readFile(path.join(root, 'subscribers.json'), 'utf8')); }
        catch (e) { if (e.code === 'ENOENT') return []; throw e; }
        if (!Array.isArray(rows)) throw new Error('Invalid subscriber file');
        const s = await readState();
        const unique = new Map();
        for (const r of rows) {
            const email = String(r.email || '').trim().toLowerCase();
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !s.blocked.includes(email)) {
                unique.set(email, { email, fullName: String(r.fullName || '').trim() || 'friend' });
            }
        }
        return [...unique.values()];
    };
    const cookie = (value, age) => `brown_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${base.protocol === 'https:' ? '; Secure' : ''}`;
    const auth = (req, res, next) => {
        const id = /(?:^|;\s*)brown_admin=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
        const session = sessions.get(id);
        if (!session || session.expires < Date.now()) { sessions.delete(id); return res.status(401).json({ message: 'Please log in again.' }); }
        if (req.method !== 'GET' && !equal(req.get('X-CSRF-Token'), session.csrf)) return res.status(403).json({ message: 'Please refresh and try again.' });
        req.owner = session; req.sessionId = id; next();
    };
    app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
    app.get('/admin.css', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.css')));
    app.get('/admin.js', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.js')));
    const api = express.Router();
    app.use('/api/admin', api);
    api.use(express.json({ limit: '100kb' }));
    api.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
    api.post('/login', handle(async (req, res) => {
        if (req.get('Origin') && req.get('Origin') !== base.origin) return res.status(403).json({ message: 'Open the dashboard using PUBLIC_URL.' });
        const key = req.ip;
        let a = attempts.get(key);
        if (!a || a.until < Date.now()) a = { count: 0, until: Date.now() + 900000 };
        attempts.set(key, a);
        if (++a.count > 10) return res.status(429).json({ message: 'Too many attempts. Wait 15 minutes.' });
        const password = req.body?.password;
        const [salt, hash] = env.ADMIN_PASSWORD_HASH.split(':');
        if (typeof password !== 'string' || password.length > 256 || !hash) return res.status(401).json({ message: 'Incorrect password.' });
        const actual = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, b) => e ? reject(e) : resolve(b.toString('hex'))));
        if (!equal(hash, actual)) return res.status(401).json({ message: 'Incorrect password.' });
        attempts.delete(key);
        const id = crypto.randomBytes(32).toString('hex');
        const session = { csrf: crypto.randomBytes(24).toString('hex'), expires: Date.now() + 3600000 };
        sessions.set(id, session);
        res.setHeader('Set-Cookie', cookie(id, 3600)); res.json({ csrf: session.csrf });
    }));
    api.use(auth);
    api.get('/session', (req, res) => res.json({ csrf: req.owner.csrf }));
    api.post('/logout', (req, res) => { sessions.delete(req.sessionId); res.setHeader('Set-Cookie', cookie('', 0)); res.json({ ok: true }); });
    api.get('/subscribers', handle(async (req, res) => res.json(await subscribers())));
    api.get('/campaigns', handle(async (req, res) => res.json((await readState()).campaigns.slice(-20).reverse())));
    api.post('/preview', handle(async (req, res) => {
        const { subject, message, mode, emails } = req.body || {};
        if (typeof subject !== 'string' || !subject.trim() || subject.length > 150 || /[\r\n]/.test(subject) || typeof message !== 'string' || !message.trim() || message.length > 20000) return res.status(400).json({ message: 'Enter a subject (up to 150 characters) and message (up to 20,000).' });
        if (!['all', 'selected'].includes(mode) || (mode === 'selected' && !Array.isArray(emails))) return res.status(400).json({ message: 'Choose your recipients.' });
        const all = await subscribers();
        const recipients = mode === 'all' ? all : all.filter(r => emails.includes(r.email));
        if (!recipients.length || recipients.length > 100) return res.status(400).json({ message: 'Choose between 1 and 100 subscribers per campaign.' });
        for (const [id, d] of drafts) if (d.expires < Date.now()) drafts.delete(id);
        if (drafts.size >= 100) return res.status(429).json({ message: 'Too many previews. Please wait.' });
        const id = crypto.randomUUID();
        const draft = { id, subject: subject.trim(), message: message.trim(), recipients, owner: req.sessionId, expires: Date.now() + 600000 };
        drafts.set(id, draft);
        res.json({ id, subject: draft.subject, recipients, previews: recipients.map(r => ({ email: r.email, text: draft.message.replaceAll('{{fullName}}', r.fullName) })) });
    }));
    api.post('/send', handle(async (req, res) => {
        const draft = drafts.get(req.body?.id);
        if (!draft || draft.owner !== req.sessionId || draft.expires < Date.now()) return res.status(400).json({ message: 'Preview your message again before sending.' });
        if (busy) return res.status(409).json({ message: 'Another campaign is sending. Wait for it to finish.' });
        busy = true;
        try {
            const campaign = { id: draft.id, subject: draft.subject, createdAt: new Date().toISOString(), status: 'sending', recipients: draft.recipients.map(r => ({ ...r, status: 'pending' })) };
            await update(s => { if (s.campaigns.some(c => c.id === draft.id)) throw new Error('Already started'); s.campaigns.push(campaign); });
            drafts.delete(draft.id);
            res.status(202).json({ id: campaign.id });
            void deliver(draft).catch(e => console.error('Campaign interrupted:', e)).finally(() => { busy = false; });
        } catch (e) { busy = false; throw e; }
    }));
    async function deliver(draft) {
        for (const r of draft.recipients) {
            const blocked = (await readState()).blocked.includes(r.email);
            await update(s => { s.campaigns.find(c => c.id === draft.id).recipients.find(x => x.email === r.email).status = blocked ? 'skipped' : 'sending'; });
            if (blocked) continue;
            let status;
            try {
                const link = new URL('/unsubscribe', base);
                link.searchParams.set('email', r.email); link.searchParams.set('token', token(r.email));
                const result = await transporter.sendMail({
                    from: { name: 'The Brown Print', address: env.EMAIL_USER },
                    to: r.email,
                    subject: draft.subject,
                    text: draft.message.replaceAll('{{fullName}}', r.fullName) + '\n\n— The Brown Print\nUnsubscribe: ' + link.href,
                    list: { unsubscribe: link.href }
                });
                status = result.accepted?.some(x => String(x).toLowerCase() === r.email) ? 'accepted' : 'failed';
            } catch (e) { status = 'failed'; console.error('Newsletter send failed:', e.code || 'SMTP error'); }
            await update(s => { s.campaigns.find(c => c.id === draft.id).recipients.find(x => x.email === r.email).status = status; });
        }
        await update(s => { s.campaigns.find(c => c.id === draft.id).status = 'finished'; });
    }
    const validUnsubscribe = req => typeof req.query.email === 'string' && typeof req.query.token === 'string' && equal(token(req.query.email), req.query.token);
    const page = content => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Brown Print</title><link rel="stylesheet" href="/admin.css"><main class="login card"><p class="eyebrow">THE BROWN PRINT</p>${content}</main></html>`;
    app.get('/unsubscribe', (req, res) => {
        if (!validUnsubscribe(req)) return res.status(400).send(page('<h1>Invalid link</h1><p>Please use the link in your email.</p>'));
        res.set('Referrer-Policy', 'no-referrer');
        res.send(page('<h1>Leave the list?</h1><p>You will stop receiving newsletter updates.</p><form method="post"><button>Unsubscribe</button></form>'));
    });
    app.post('/unsubscribe', handle(async (req, res) => {
        if (!validUnsubscribe(req)) return res.status(400).send(page('<h1>Invalid link</h1>'));
        await update(s => { if (!s.blocked.includes(req.query.email)) s.blocked.push(req.query.email); });
        res.send(page('<h1>You’re unsubscribed.</h1><p>Thank you for being part of the journey.</p><a href="/">Back to The Brown Print</a>'));
    }));
    app.use((err, req, res, next) => {
        if (!req.path.startsWith('/api/admin')) return next(err);
        console.error('Dashboard error:', err.message);
        res.status(500).json({ message: 'Could not complete that action. Check the server terminal.' });
    });
    return { ready };
};
