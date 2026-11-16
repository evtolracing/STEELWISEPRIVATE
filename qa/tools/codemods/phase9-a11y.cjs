#!/usr/bin/env node
// Phase 9 (B-015): gives a name to icon-only buttons and to fields that had only a placeholder, and
// makes the title of each page its main heading. It reads the JSX with a parser and inserts text at
// exact positions, so nothing else in a file moves. Run it from src/frontend:
//   node ../../qa/tools/codemods/phase9-a11y.cjs [--write] [--only buttons,fields,headings]
// Without --write it reports what it would change and what it cannot name.
const fs = require('node:fs');
const path = require('node:path');
const parser = require(path.resolve('node_modules/@babel/parser'));
const traverse = require(path.resolve('node_modules/@babel/traverse')).default;

const WRITE = process.argv.includes('--write');
const only = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1].split(',') : ['buttons', 'fields', 'headings']; })();
const SRC = path.resolve('src');

const ICON_NAMES = {
  Visibility: 'View', VisibilityOutlined: 'View', RemoveRedEye: 'View', VisibilityOff: 'Hide', Preview: 'Preview',
  MoreVert: 'More actions', MoreHoriz: 'More actions', Refresh: 'Refresh', Sync: 'Refresh', Autorenew: 'Refresh', Cached: 'Refresh', Replay: 'Run again',
  Print: 'Print', LocalPrintshop: 'Print', Edit: 'Edit', EditOutlined: 'Edit', ModeEdit: 'Edit', Create: 'Edit',
  Delete: 'Delete', DeleteOutline: 'Delete', DeleteForever: 'Delete', Cancel: 'Cancel', Block: 'Block',
  ExpandMore: 'Show details', KeyboardArrowDown: 'Show details', ExpandLess: 'Hide details', KeyboardArrowUp: 'Hide details', UnfoldMore: 'Expand', UnfoldLess: 'Collapse',
  Close: 'Close', Clear: 'Clear', Add: 'Add', AddCircle: 'Add', AddCircleOutline: 'Add', Remove: 'Remove', RemoveCircle: 'Remove', RemoveCircleOutline: 'Remove',
  ArrowBack: 'Back', ArrowBackIos: 'Back', ArrowBackIosNew: 'Back', ArrowForward: 'Next', ArrowForwardIos: 'Next', ChevronLeft: 'Previous', ChevronRight: 'Next',
  NavigateBefore: 'Previous', NavigateNext: 'Next', KeyboardArrowLeft: 'Previous', KeyboardArrowRight: 'Next', FirstPage: 'First page', LastPage: 'Last page',
  ArrowUpward: 'Move up', ArrowDownward: 'Move down', Search: 'Search', FilterList: 'Filters', FilterAlt: 'Filters', Tune: 'Options', Sort: 'Sort',
  Download: 'Download', GetApp: 'Download', FileDownload: 'Download', CloudDownload: 'Download', Upload: 'Upload', FileUpload: 'Upload', CloudUpload: 'Upload', AttachFile: 'Attach a file',
  ContentCopy: 'Copy', FileCopy: 'Copy', Send: 'Send', PlayArrow: 'Start', PlayCircle: 'Start', Pause: 'Pause', Stop: 'Stop', SkipNext: 'Next step', SkipPrevious: 'Previous step',
  ZoomIn: 'Zoom in', ZoomOut: 'Zoom out', Fullscreen: 'Full screen', FullscreenExit: 'Leave full screen', CenterFocusStrong: 'Centre the view', MyLocation: 'Centre the view',
  Settings: 'Settings', Save: 'Save', Star: 'Remove from favourites', StarBorder: 'Add to favourites', Logout: 'Sign out', ExitToApp: 'Sign out', Home: 'Home', Menu: 'Open the menu',
  Help: 'Help', HelpOutline: 'Help', Info: 'More information', InfoOutlined: 'More information', Notifications: 'Notifications', QrCodeScanner: 'Scan a code', QrCode: 'Show the code', QrCode2: 'Show the code',
  CameraAlt: 'Take a photo', PhotoCamera: 'Take a photo', Mic: 'Speak', MicOff: 'Stop listening', VolumeUp: 'Read aloud', VolumeOff: 'Stop reading aloud',
  OpenInNew: 'Open in a new tab', Launch: 'Open', Check: 'Confirm', CheckCircle: 'Confirm', Done: 'Done', Undo: 'Undo', Redo: 'Redo', History: 'History', Share: 'Share',
  Mail: 'Email', Email: 'Email', Phone: 'Call', CalendarToday: 'Choose a date', Event: 'Choose a date', DragIndicator: 'Drag to reorder', Lock: 'Lock', LockOpen: 'Unlock',
  ThumbUp: 'Approve', ThumbDown: 'Reject', Flag: 'Flag', PushPin: 'Pin', Bookmark: 'Remove bookmark', BookmarkBorder: 'Bookmark', Link: 'Copy the link', Backspace: 'Delete the last character',
  ShoppingCart: 'Open the cart', AddShoppingCart: 'Add to the cart', Chat: 'Open the chat', Comment: 'Comments', NoteAdd: 'Add a note', Description: 'Open the document', PictureAsPdf: 'Open the PDF', Assignment: 'Open the details',
  SwapHoriz: 'Swap', SwapVert: 'Swap', Timeline: 'History', Map: 'Show on the map', LocationOn: 'Show the location', Keyboard: 'Show the keyboard', Calculate: 'Calculate', Warning: 'Show the warning',
  ViewList: 'Show as a list', ViewModule: 'Show as cards', GridView: 'Show as cards', TableChart: 'Show as a table', Dashboard: 'Open the dashboard', SmartToy: 'Open the assistant', AutoAwesome: 'Ask the assistant',
  RestartAlt: 'Reset', ClearAll: 'Clear all', SelectAll: 'Select all', Person: 'Open the account', AccountCircle: 'Open the account', Language: 'Language', Translate: 'Translate',
};
const tidy = (placeholder) => String(placeholder).replace(/[.…]+\s*$/, '').replace(/^e\.g\.,?\s*/i, 'For example ').trim();

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['mocks', 'node_modules'].includes(e.name) ? [] : walk(path.join(dir, e.name))) : /\.jsx$/.test(e.name) ? [path.join(dir, e.name)] : []));
const nameOf = (n) => (n.type === 'JSXIdentifier' ? n.name : n.type === 'JSXMemberExpression' ? `${nameOf(n.object)}.${n.property.name}` : '');
const attr = (el, name) => el.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);
const spread = (el) => el.openingElement.attributes.some((a) => a.type === 'JSXSpreadAttribute');

// Which files are pages of the router.
const routerText = fs.readFileSync(path.join(SRC, 'router/AppRouter.jsx'), 'utf8');
const pageFiles = new Set();
for (const m of routerText.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
  const base = path.resolve(SRC, 'router', m[1]);
  for (const c of [base, `${base}.jsx`, path.join(base, 'index.jsx'), path.join(base, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) { pageFiles.add(c); break; }
}
// A page that only re-exports another file: follow one step.
for (const f of [...pageFiles]) {
  if (!/index\.js$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8'); const m = t.match(/from\s+['"](\.[^'"]+)['"]/);
  if (m) { const b = path.resolve(path.dirname(f), m[1]); for (const c of [b, `${b}.jsx`]) if (fs.existsSync(c) && fs.statSync(c).isFile()) pageFiles.add(c); }
}

// A page that is a small router of its own (the sub-applications): its screens are pages too.
for (const f of [...pageFiles]) {
  const t = fs.readFileSync(f, 'utf8');
  if (!/<Routes>/.test(t)) continue;
  pageFiles.delete(f);
  for (const m of t.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const b = path.resolve(path.dirname(f), m[1]);
    for (const c of [b, `${b}.jsx`, path.join(b, 'index.jsx')]) if (fs.existsSync(c) && fs.statSync(c).isFile() && /\.jsx$/.test(c)) { pageFiles.add(c); break; }
  }
}
const report = { buttons: 0, fields: 0, headings: 0, files: 0, unknownIcons: {}, unnamedFields: [], noHeading: [] };
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  let ast;
  try { ast = parser.parse(text, { sourceType: 'module', plugins: ['jsx'] }); } catch (e) { console.error(`cannot parse ${file}: ${e.message}`); continue; }
  const icons = {};
  const edits = [];
  let heading = null;
  traverse(ast, {
    ImportDeclaration(p) {
      const src = p.node.source.value;
      if (src === '@mui/icons-material') for (const s of p.node.specifiers) if (s.type === 'ImportSpecifier') icons[s.local.name] = s.imported.name;
      const m = src.match(/^@mui\/icons-material\/(\w+)$/);
      if (m) for (const s of p.node.specifiers) icons[s.local.name] = m[1];
    },
    JSXElement(p) {
      const el = p.node; const name = nameOf(el.openingElement.name);
      const insertAt = el.openingElement.name.end;
      if (only.includes('buttons') && (name === 'IconButton' || name === 'Fab')) {
        if (attr(el, 'aria-label') || attr(el, 'title') || attr(el, 'aria-labelledby')) return;
        const parent = p.parentPath && p.parentPath.node;
        // A Tooltip names its direct child, and only when its title is text. A span between the two
        // (the usual pattern around a button that can be disabled) takes the name, and the button has none.
        if (parent && parent.type === 'JSXElement' && nameOf(parent.openingElement.name) === 'Tooltip' && attr(parent, 'title')) {
          const tv = attr(parent, 'title').value;
          const node = tv && tv.type === 'JSXExpressionContainer' && ['JSXElement', 'JSXFragment'].includes(tv.expression.type);
          if (!node) return;
        }
        if (el.children.some((c) => c.type === 'JSXText' && c.value.trim())) return;
        let found = null;
        p.traverse({ JSXOpeningElement(q) { const n = nameOf(q.node.name); if (!found && n !== name && (icons[n] || /Icon$/.test(n))) found = icons[n] || n.replace(/Icon$/, ''); } });
        const key = found ? found.replace(/(Outlined|Rounded|Sharp|TwoTone)$/, '') : null;
        const label = key && (ICON_NAMES[key] || ICON_NAMES[found]);
        if (!label) { const k = found || '(no icon found)'; (report.unknownIcons[k] ||= []).push(`${path.relative(SRC, file)}:${el.loc.start.line}`); return; }
        edits.push({ at: insertAt, text: ` aria-label="${label}"` }); report.buttons += 1;
      }
      if (only.includes('fields') && ['TextField', 'InputBase', 'OutlinedInput', 'Input'].includes(name)) {
        if (attr(el, 'label') || attr(el, 'aria-label') || attr(el, 'aria-labelledby') || attr(el, 'select') || attr(el, 'id')) return;
        if (name === 'TextField' && attr(el, 'type') && attr(el, 'type').value && attr(el, 'type').value.value === 'hidden') return;
        const ip = attr(el, 'inputProps');
        const ipText = ip ? text.slice(ip.start, ip.end) : '';
        if (/aria-label/.test(ipText)) return;
        const ph = attr(el, 'placeholder');
        const literal = ph && ph.value && ph.value.type === 'StringLiteral' ? ph.value.value : null;
        const expr = ph && ph.value && ph.value.type === 'JSXExpressionContainer' ? text.slice(ph.value.expression.start, ph.value.expression.end) : null;
        if (!literal && !expr) { report.unnamedFields.push(`${path.relative(SRC, file)}:${el.loc.start.line} <${name}>${spread(el) ? ' (spread)' : ''}`); return; }
        const value = literal ? JSON.stringify(tidy(literal).replace(/\s+/g, ' ')) : expr;
        if (!ip) edits.push({ at: insertAt, text: ` inputProps={{ 'aria-label': ${value} }}` });
        else if (ip.value.type === 'JSXExpressionContainer' && ip.value.expression.type === 'ObjectExpression') edits.push({ at: ip.value.expression.start + 1, text: ` 'aria-label': ${value},` });
        else { report.unnamedFields.push(`${path.relative(SRC, file)}:${el.loc.start.line} <${name}> (inputProps is not a literal)`); return; }
        report.fields += 1;
      }
      if (only.includes('headings') && pageFiles.has(file) && name === 'Typography' && !heading) {
        const v = attr(el, 'variant');
        const variant = v && v.value && v.value.type === 'StringLiteral' ? v.value.value : null;
        if (['h3', 'h4', 'h5'].includes(variant)) heading = { el, has: Boolean(attr(el, 'component')), at: insertAt };
      }
    },
  });
  if (only.includes('headings') && pageFiles.has(file)) {
    if (/component=["']h1["']|<h1\b/.test(text)) { /* already has one */ }
    else if (heading && !heading.has) { edits.push({ at: heading.at, text: ' component="h1"' }); report.headings += 1; }
    else report.noHeading.push(path.relative(SRC, file));
  }
  if (!edits.length) continue;
  report.files += 1;
  if (WRITE) {
    let out = text;
    for (const e of edits.sort((a, b) => b.at - a.at)) out = out.slice(0, e.at) + e.text + out.slice(e.at);
    try { parser.parse(out, { sourceType: 'module', plugins: ['jsx'] }); fs.writeFileSync(file, out); } catch (e) { console.error(`NOT WRITTEN ${file}: ${e.message}`); }
  }
}
const unknown = Object.entries(report.unknownIcons).sort((a, b) => b[1].length - a[1].length);
console.log(JSON.stringify({ write: WRITE, pages: pageFiles.size, files: report.files, buttonsNamed: report.buttons, fieldsNamed: report.fields, headingsMade: report.headings, buttonsNotNamed: unknown.reduce((n, [, v]) => n + v.length, 0), fieldsNotNamed: report.unnamedFields.length, pagesWithNoTitleFound: report.noHeading.length }, null, 1));
for (const [k, v] of unknown) console.log(`  icon ${k}: ${v.length}  ${v.slice(0, 4).join(' ')}`);
for (const f of report.unnamedFields) console.log(`  field ${f}`);
for (const f of report.noHeading) console.log(`  no title ${f}`);
