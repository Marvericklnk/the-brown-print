const $ = id => document.getElementById(id);
let csrf = '', people = [], preview = null, activeCampaign = null, timer;
function notice(text) { $('notice').textContent = text; clearTimeout(timer); timer = setTimeout(() => { $('notice').textContent = ''; }, 5000); }
async function api(url, body) {
    const response = await fetch('/api/admin/' + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json();
    if (!response.ok) {
        if (response.status === 401) { $('studio').hidden = true; $('login').hidden = false; $('logout').hidden = true; }
        throw new Error(result.message || 'Something went wrong.');
    }
    return result;
}
function invalidate() { preview = null; $('preview').hidden = true; }
function drawPeople() {
    const query = $('search').value.toLowerCase();
    const selected = new Set([...document.querySelectorAll('.person input:checked')].map(x => x.value));
    const choose = document.querySelector('[name=mode]:checked').value === 'selected';
    $('recipients').replaceChildren();
    for (const p of people) {
        const label = document.createElement('label'); label.className = 'person';
        label.hidden = !(p.fullName + ' ' + p.email).toLowerCase().includes(query);
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = p.email; checkbox.checked = selected.has(p.email); checkbox.disabled = !choose; checkbox.addEventListener('change', invalidate);
        const name = document.createElement('span'); name.textContent = p.fullName;
        const email = document.createElement('small'); email.textContent = p.email; name.append(email); label.append(checkbox, name); $('recipients').append(label);
    }
}
async function loadHistory() {
    const campaigns = await api('campaigns'); $('history').replaceChildren();
    if (!campaigns.length) $('history').textContent = 'Your first update starts here.';
    activeCampaign = campaigns.some(c => c.status === 'sending');
    for (const c of campaigns) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const counts = {};
        for (const r of c.recipients) counts[r.status] = (counts[r.status] || 0) + 1;
        summary.textContent = c.subject + ' · ' + c.status + ' · ' + Object.entries(counts).map(([k,v]) => v + ' ' + k).join(', ');
        const date = document.createElement('p'); date.className = 'hint'; date.textContent = new Date(c.createdAt).toLocaleString();
        const list = document.createElement('ul');
        for (const r of c.recipients) { const li = document.createElement('li'); li.textContent = r.fullName + ' · ' + r.email + ' · ' + r.status; list.append(li); }
        details.append(summary, date, list); $('history').append(details);
    }
}
async function openStudio() {
    people = await api('subscribers'); $('count').textContent = people.length + ' active subscribers';
    drawPeople(); await loadHistory();
    $('login').hidden = true; $('studio').hidden = false; $('logout').hidden = false;
}
$('login-form').addEventListener('submit', async e => {
    e.preventDefault(); const button = e.submitter; button.disabled = true;
    try { const result = await api('login', { password: $('password').value }); csrf = result.csrf; $('password').value = ''; await openStudio(); } catch(e) { notice(e.message); } finally { button.disabled = false; }
});
$('logout').addEventListener('click', async () => { try { await api('logout', {}); location.reload(); } catch(e) { notice(e.message); } });
$('search').addEventListener('input', drawPeople);
document.querySelectorAll('[name=mode]').forEach(x => x.addEventListener('change', () => { invalidate(); drawPeople(); }));
$('subject').addEventListener('input', invalidate); $('message').addEventListener('input', invalidate);
$('compose').addEventListener('submit', async e => {
    e.preventDefault(); e.submitter.disabled = true;
    try {
        preview = await api('preview', { subject: $('subject').value, message: $('message').value, mode: document.querySelector('[name=mode]:checked').value, emails: [...document.querySelectorAll('.person input:checked')].map(x => x.value) });
        $('preview-subject').textContent = preview.subject; $('preview-count').textContent = preview.recipients.length + ' individual emails'; $('preview-person').replaceChildren();
        preview.recipients.forEach((p, i) => { const o = document.createElement('option'); o.value = i; o.textContent = p.fullName + ' · ' + p.email; $('preview-person').append(o); });
        $('preview-text').textContent = preview.previews[0].text; $('send').textContent = 'Send to ' + preview.recipients.length + ' subscriber(s)'; $('preview').hidden = false; $('preview').scrollIntoView({ behavior: 'smooth' });
    } catch(e) { notice(e.message); } finally { e.submitter.disabled = false; }
});
$('preview-person').addEventListener('change', () => { if (preview) $('preview-text').textContent = preview.previews[Number($('preview-person').value)].text; });
$('edit').addEventListener('click', () => { invalidate(); $('subject').focus(); });
$('send').addEventListener('click', () => { if (!preview) return; $('confirmation-text').textContent = 'Send “' + preview.subject + '” to ' + preview.recipients.length + ' subscriber(s)?'; $('confirmation').showModal(); });
$('cancel-send').addEventListener('click', () => $('confirmation').close());
$('confirm-send').addEventListener('click', async () => {
    if (!preview) return; $('confirm-send').disabled = true; $('send').disabled = true;
    try { await api('send', { id: preview.id }); $('confirmation').close(); invalidate(); notice('Sending started. Check the history below.'); await loadHistory(); }
    catch(e) { $('confirmation').close(); notice(e.message + ' Check history before starting again.'); await loadHistory().catch(() => {}); }
    finally { $('confirm-send').disabled = false; $('send').disabled = false; }
});
setInterval(() => { if (!$('studio').hidden && activeCampaign) loadHistory().catch(e => notice(e.message)); }, 2500);
(async () => { try { const result = await api('session'); csrf = result.csrf; await openS…1831 tokens truncated…cript></head>
<body>
<header><a href="/">THE<span>BROWN</span>PRINT</a><span class="owner">OWNER STUDIO</span><button id="logout" class="secondary" hidden>Log out</button></header>
<main>
<section id="login" class="card login"><p class="eyebrow">YOUR WORDS. YOUR COMMUNITY.</p><h1>Welcome <em>back.</em></h1><p class="muted">Sign in to write to the people building alongside you.</p><form id="login-form"><label for="password">Dashboard password</label><input id="password" type="password" autocomplete="current-password" required><button>Open my dashboard →</button></form></section>
<div id="studio" hidden>
<section class="welcome"><p class="eyebrow">KEEP THE CONVERSATION GOING</p><h1>A little update.<br><em>A lasting connection.</em></h1><p class="muted">Write once. Make every greeting personal.</p></section>
<div class="layout"><section class="card"><p class="eyebrow">01 / YOUR MESSAGE</p><h2>What’s new?</h2><form id="compose"><label for="subject">Email subject</label><input id="subject" maxlength="150" placeholder="A new chapter of The Brown Print" required><label for="message">Your message</label><p class="hint">Keep {{fullName}} where you want each person’s registered name.</p><textarea id="message" maxlength="20000" rows="12" required>Hello {{fullName}},

I have a new update to share with you.

Thank you for building with me, brick by brick.

Mavericklink</textarea><button>Preview message →</button></form></section>
<section class="card"><p class="eyebrow">02 / YOUR COMMUNITY</p><h2>Who’s it for?</h2><p id="count" class="muted"></p><label class="choice"><input type="radio" name="mode" value="all" checked> Send to everyone</label><label class="choice"><input type="radio" name="mode" value="selected"> Choose subscribers</label><label for="search">Find a subscriber</label><input id="search" type="search" placeholder="Search by name or email"><div id="recipients" class="recipient-list"></div><p class="hint">Each person gets a separate email. Addresses stay private. Up to 100 recipients per campaign.</p></section></div>
<section id="preview" class="card" hidden><p class="eyebrow">03 / CHECK BEFORE YOU SEND</p><h2 id="preview-subject"></h2><p id="preview-count" class="muted"></p><label for="preview-person">Preview as</label><select id="preview-person"></select><pre id="preview-text"></pre><p class="hint">An unsubscribe link is added to every email.</p><button id="send">Send this message</button><button id="edit" class="secondary">Back to editing</button></section>
<section class="card history"><p class="eyebrow">YOUR RECENT UPDATES</p><h2>Sending history</h2><p class="hint">“Accepted” means the mail server accepted the email; it does not confirm inbox delivery. No automatic retries.</p><div id="history"></div></section>
</div><p id="notice" role="status" aria-live="polite"></p>
</main><footer>THE BROWN PRINT · One journey. One brick at a time.</footer>
<dialog id="confirmation"><h2>Ready to send?</h2><p id="confirmation-text"></p><p>This action sends real emails.</p><button id="confirm-send">Yes, send now</button><button id="cancel-send" class="secondary">Keep editing</button></dialog>
</body></html>
