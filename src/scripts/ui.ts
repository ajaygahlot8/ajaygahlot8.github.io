// Theme toggle, copy buttons, ⌘K palette. Vanilla, no deps.
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const root = document.documentElement;
const flash = (b: HTMLElement, msg: string) => { const o = b.textContent; b.textContent = msg; setTimeout(() => (b.textContent = o), 1400); };
const copy = (text: string, b?: HTMLElement) => navigator.clipboard.writeText(text).then(() => b && flash(b, 'Copied'), () => b && flash(b, 'Failed'));
const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
const toggleTheme = () => { const t = dark() ? 'light' : 'dark'; root.dataset.theme = t; try { localStorage.setItem('theme', t); } catch {} };

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-toggle],[data-copy],[data-cmdk],[data-print]');
  if (!el) return;
  if (el.hasAttribute('data-theme-toggle')) toggleTheme();
  else if (el.dataset.copy) copy(el.dataset.copy, el);
  else if (el.hasAttribute('data-cmdk')) open();
  else if (el.hasAttribute('data-print')) print();
});

// Code-block copy buttons
document.querySelectorAll<HTMLElement>('.prose pre').forEach((pre) => {
  const wrap = document.createElement('div'); wrap.className = 'codeblock';
  pre.replaceWith(wrap); wrap.append(pre);
  const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Copy'; b.setAttribute('aria-label', 'Copy code');
  b.onclick = () => copy(pre.innerText, b); wrap.append(b);
});

// Palette
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
if (!mac) document.querySelectorAll('[data-mod]').forEach((k) => (k.textContent = 'Ctrl K'));
const dlg = $<HTMLDialogElement>('#cmdk'), input = $<HTMLInputElement>('#cmdk-q'), list = $('#cmdk-list');
const { items: pages, me } = JSON.parse($('#cmdk-data').textContent!);
type Item = { t: string; k: string; h?: string; run?: () => void };
const all: Item[] = [
  ...pages,
  { t: 'Copy email address', k: 'Action', run: () => copy(me.email) },
  { t: 'Toggle theme', k: 'Action', run: toggleTheme },
  { t: 'Open LinkedIn', k: 'Link', h: me.linkedin },
  { t: 'Open GitHub', k: 'Link', h: me.github },
  { t: 'Print resume (PDF)', k: 'Action', run: () => (location.pathname.startsWith('/about') ? print() : (location.href = '/about/#print')) },
];
let shown: Item[] = [], sel = 0;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
function draw() {
  list.innerHTML = shown.length
    ? shown.map((it, i) => `<li role="option" id="o${i}" data-i="${i}" aria-selected="${i === sel}"><span>${esc(it.t)}</span><small>${it.k}</small></li>`).join('')
    : '<li class="none" role="presentation">No matches</li>';
  input.setAttribute('aria-activedescendant', shown.length ? `o${sel}` : '');
  list.children[sel]?.scrollIntoView({ block: 'nearest' });
}
function filter() { const q = input.value.trim().toLowerCase(); shown = all.filter((i) => `${i.t} ${i.k}`.toLowerCase().includes(q)); sel = 0; draw(); }
function open() { input.value = ''; filter(); dlg.showModal(); input.focus(); }
function run(it?: Item) {
  if (!it) return;
  dlg.close();
  if (it.run) it.run(); else if (it.h!.startsWith('http')) window.open(it.h, '_blank', 'noopener'); else location.href = it.h!;
}
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); }
});
input.addEventListener('input', filter);
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); if (!shown.length) return;
    sel = (sel + (e.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length; draw();
  } else if (e.key === 'Enter') { e.preventDefault(); run(shown[sel]); }
});
list.addEventListener('click', (e) => { const li = (e.target as HTMLElement).closest<HTMLElement>('li[data-i]'); if (li) run(shown[+li.dataset.i!]); });
list.addEventListener('mousemove', (e) => { const li = (e.target as HTMLElement).closest<HTMLElement>('li[data-i]'); if (li && +li.dataset.i! !== sel) { sel = +li.dataset.i!; list.querySelector('[aria-selected=true]')?.setAttribute('aria-selected', 'false'); li.setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', li.id); } });
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // backdrop click
