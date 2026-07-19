// Thermal receipt printer form.
//
// The backend lives at print.badhrinadh.com and is the same service the old
// portfolio page used. Contract:
//   POST /contact        {name, email, message, browser_time, image_b64?}
//                        -> 429 when rate limited, {queued: true} when the
//                           printer is busy, {error} on failure
//   GET  /contact/count  -> {printed: <number>}
//
// image_b64 is raw base64 with the data-URL prefix stripped, and the 10 MB
// cap mirrors the server's own upload limit.

const PRINT_ENDPOINT = 'https://print.badhrinadh.com/contact'
const COUNT_ENDPOINT = 'https://print.badhrinadh.com/contact/count'
const CHAR_LIMIT = 500
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

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

  // Optional image attachment
  const imageInput = document.querySelector('#print-image')
  const cameraInput = document.querySelector('#print-camera')
  const imageName = document.querySelector('#print-image-name')
  const imageClear = document.querySelector('#print-image-clear')
  let imageB64 = null

  const clearImage = () => {
    imageB64 = null
    imageInput.value = ''
    cameraInput.value = ''
    imageName.textContent = ''
    imageClear.hidden = true
  }

  const takeImage = input => {
    const file = input.files[0]
    if (!file) return clearImage()

    if (!file.type.startsWith('image/')) {
      setStatus('That file is not an image.', 'err')
      return clearImage()
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus('Image is larger than 10 MB.', 'err')
      return clearImage()
    }

    const reader = new FileReader()
    reader.onload = () => {
      // Strip the "data:image/png;base64," prefix — the server wants raw base64.
      imageB64 = String(reader.result).split(',')[1] || null
      imageName.textContent = file.name || 'Photo'
      imageClear.hidden = false
      setStatus('')
    }
    reader.onerror = () => {
      setStatus('Could not read that image.', 'err')
      clearImage()
    }
    reader.readAsDataURL(file)
  }

  // Only one of the two inputs holds the attachment; picking from one
  // resets the other so they can't both be populated.
  imageInput.addEventListener('change', () => {
    cameraInput.value = ''
    takeImage(imageInput)
  })
  cameraInput.addEventListener('change', () => {
    imageInput.value = ''
    takeImage(cameraInput)
  })
  imageClear.addEventListener('click', clearImage)

  form.addEventListener('submit', async event => {
    event.preventDefault()

    const name = form.elements.name.value.trim()
    const email = form.elements.email.value.trim()
    const body = message.value.trim()

    // Honeypot: only a bot fills this, so fake success rather than telling it why.
    if (form.elements._trap.value) {
      setStatus('Message received — printing now.', 'ok')
      form.reset()
      clearImage()
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
      const payload = {
        name,
        email,
        message: body,
        browser_time: new Date().toLocaleString('en-US', {timeZoneName: 'short'})
      }
      if (imageB64) payload.image_b64 = imageB64

      const res = await fetch(PRINT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
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
      clearImage()
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
