// Thermal receipt printer form.
//
// The backend lives at print.badhrinadh.com and is the same service the old
// portfolio page used. Contract:
//   POST /contact        {name, email, message, browser_time, image_b64?}
//                        -> 429 when rate limited, {queued: true} when the
//                           printer is busy, {error} on failure
//   GET  /contact/count  -> {printed: <number>}

const PRINT_ENDPOINT = 'https://print.badhrinadh.com/contact'
const COUNT_ENDPOINT = 'https://print.badhrinadh.com/contact/count'
const CHAR_LIMIT = 500

const form = document.querySelector('#print-form')
if (form) {
  const button = form.querySelector('button[type="submit"]')
  const status = form.querySelector('#print-status')
  const remaining = form.querySelector('#print-remaining')
  const message = form.elements.message
  const countWrap = document.querySelector('#print-count')
  const countNum = document.querySelector('#print-count-n')

  const setStatus = (text, kind) => {
    status.textContent = text
    status.dataset.kind = kind || ''
  }

  // Character counter
  const updateCount = () => {
    remaining.textContent = `${message.value.length} / ${CHAR_LIMIT}`
  }
  message.addEventListener('input', updateCount)
  updateCount()

  // Total printed. The counter stays hidden until it resolves, so a failed
  // fetch leaves no empty placeholder sitting on the page.
  const fetchCount = async () => {
    try {
      const res = await fetch(COUNT_ENDPOINT, {cache: 'no-store'})
      if (!res.ok) return
      const json = await res.json()
      if (typeof json.printed === 'number') {
        countNum.textContent = json.printed.toLocaleString()
        countWrap.hidden = false
      }
    } catch {
      /* leave it hidden */
    }
  }
  fetchCount()

  form.addEventListener('submit', async event => {
    event.preventDefault()

    const name = form.elements.name.value.trim()
    const email = form.elements.email.value.trim()
    const body = message.value.trim()

    // Honeypot: only a bot fills this, so fake success rather than telling it why.
    if (form.elements._trap.value) {
      setStatus('Message received — printing now.', 'ok')
      form.reset()
      updateCount()
      return
    }

    if (!name || !body) {
      setStatus('Name and message are both required.', 'err')
      return
    }
    if (body.length > CHAR_LIMIT) {
      setStatus(`Message must be ${CHAR_LIMIT} characters or fewer.`, 'err')
      return
    }

    button.disabled = true
    button.textContent = 'Printing…'
    setStatus('')

    try {
      const res = await fetch(PRINT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          email,
          message: body,
          browser_time: new Date().toLocaleString('en-US', {timeZoneName: 'short'})
        })
      })

      const json = await res.json().catch(() => ({}))

      if (res.status === 429) {
        setStatus("You've sent too many messages — please wait an hour before trying again.", 'err')
        return
      }
      if (!res.ok) throw new Error(json.error || 'server error')

      setStatus(
        json.queued
          ? 'Message received. The printer is busy — it will print shortly.'
          : 'Message received — printing now.',
        'ok'
      )
      form.reset()
      updateCount()

      // The counter only moves once the printer worker finishes the job,
      // so re-check a couple of times rather than assuming.
      setTimeout(fetchCount, 3000)
      setTimeout(fetchCount, 10000)
    } catch {
      setStatus('Could not send — try again.', 'err')
    } finally {
      button.disabled = false
      button.textContent = 'Print it'
    }
  })
}
