import fs from 'fs'
import path from 'path'

// Inputs arrive via env rather than argv so that content containing quotes,
// newlines, or shell metacharacters can't break out into the runner's shell.
const {NOTE_DATETIME: datetime, NOTE_TAGS: tags, NOTE_LANG: lang, NOTE_LOCATION: location, NOTE_CONTENT: content} = process.env

if (!datetime || !content) {
  console.error('NOTE_DATETIME and NOTE_CONTENT are required.')
  process.exit(1)
}

const notesDir = '_notes'

// Notes are named YYYY-MM-DD-xx.md, where xx is a doubled letter that
// increments for each additional note on the same day.
const alphabets = [...'acefmnortuvwyz']
const date = datetime.split(' ')[0]
const idx = fs.readdirSync(notesDir).filter(p => p.startsWith(date)).length
const a = alphabets[idx]

if (!a) {
  console.error(`More than ${alphabets.length} notes on ${date}; no suffix left.`)
  process.exit(1)
}

const tagList = (tags || '')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean)

const filePath = path.join(notesDir, `${date}-${a}${a}.md`)
const frontmatter = [
  'title: Note',
  'layout: default',
  'open_heart: true',
  `date: ${datetime}`,
  location ? `location: ${location}` : 'location: null',
  tagList.length ? `tags: ${tagList.map(t => `\n  - ${t}`).join('')}` : 'tags: []',
  lang ? `lang: ${lang}` : null
].filter(Boolean).join('\n')

fs.writeFileSync(filePath, `---\n${frontmatter}\n---\n\n${content}\n`)
console.log(`Wrote ${filePath}`)
