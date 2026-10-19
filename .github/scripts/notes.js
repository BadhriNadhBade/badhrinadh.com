import fs from 'fs'
import path from 'path'

// Inputs arrive via env rather than argv so that content containing quotes,
// newlines, or shell metacharacters can't break out into the runner's shell.
const {NOTE_DATETIME: datetime, NOTE_TAGS: tags, NOTE_LANG: lang, NOTE_LOCATION: location, NOTE_CONTENT: content} = process.env

if (!datetime || !content) {
  console.error('NOTE_DATETIME and NOTE_CONTENT are required.')
  process.exit(1)
}

// The date is checked against the one shape we accept rather than escaped.
// Seconds are deliberately refused: `2026-07-18 09:00:00` is a full YAML
// timestamp, which YAML reads as UTC, while `2026-07-18 09:00` isn't, so
// Jekyll parses it as site time (America/Chicago). Allowing both would file
// the same clock time five or six hours apart — sometimes on another day.
if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(datetime)) {
  console.error(`NOTE_DATETIME must look like "YYYY-MM-DD" or "YYYY-MM-DD HH:MM", got ${JSON.stringify(datetime)}.`)
  process.exit(1)
}

const notesDir = '_notes'

// Notes are named YYYY-MM-DD-xx.md, where xx is a doubled letter. Take the
// first letter whose file doesn't exist yet rather than counting that day's
// notes: after deleting one, a count would land on a name that is still taken
// and the new note would overwrite an old one.
const alphabets = [...'acefmnortuvwyz']
const date = datetime.split(' ')[0]
const a = alphabets.find(c => !fs.existsSync(path.join(notesDir, `${date}-${c}${c}.md`)))

if (!a) {
  console.error(`More than ${alphabets.length} notes on ${date}; no suffix left.`)
  process.exit(1)
}

const tagList = (tags || '')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean)

// String values are written as JSON strings, which are also valid YAML
// double-quoted scalars. Unquoted, a location like `Dallas: TX` becomes a
// nested map and a tag starting with `#`, `[`, `*` or `&` becomes a comment,
// a flow list, an alias or an anchor. JSON leaves DEL, the C1 controls and
// lone surrogates unescaped, and YAML refuses all three, so they go first.
const q = s => JSON.stringify(s.replace(/[\u007f-\u009f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, ''))

const filePath = path.join(notesDir, `${date}-${a}${a}.md`)
const frontmatter = [
  'title: Note',
  `date: ${datetime}`,
  location ? `location: ${q(location)}` : 'location: null',
  tagList.length ? `tags: ${tagList.map(t => `\n  - ${q(t)}`).join('')}` : 'tags: []',
  lang ? `lang: ${q(lang)}` : null
].filter(Boolean).join('\n')

// 'wx' fails if the file already exists. The suffix search above should make
// that impossible, but a note is never worth losing to a race or a bug there.
fs.writeFileSync(filePath, `---\n${frontmatter}\n---\n\n${content}\n`, {flag: 'wx'})
console.log(`Wrote ${filePath}`)
