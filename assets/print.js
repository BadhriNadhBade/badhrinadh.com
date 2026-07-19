// Thermal receipt printer form.
//
// The backend lives at print.badhrinadh.com and is the same service the old
// portfolio page used. Contract:
//   POST /contact        {name, email, message, browser_time, image_b64?}
//                        -> 429 when rate limited, {queued: true} when the
//                           printer is busy, {error} on failure
//   GET  /contact/count  -> {printed: <number>}
//
// image_b64 is raw base64 with the data-URL prefix stripped. Images are
// downscaled in the browser first — see shrinkImage below.

const PRINT_ENDPOINT = 'https://print.badhrinadh.com/contact'
const COUNT_ENDPOINT = 'https://print.badhrinadh.com/contact/count'
const CHAR_LIMIT = 500

// Deliberately loose. Anything stricter rejects valid addresses, and the
// field is optional anyway — this only catches obvious typos like "kjdk".
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The printer is roughly 384-576 dots wide, so anything past this is
// discarded detail. Keeps the base64 payload well under the server's cap.
const MAX_DIMENSION = 900
const JPEG_QUALITY = 0.82

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

  // Downscale through a canvas rather than sending the original file.
  //
  // The printer is ~384-576 dots wide, so a 48MP phone photo is wasted
  // bytes: raw it blows past the server's upload cap, and base64 inflates
  // it by a further third. Re-encoding also drops EXIF — including GPS —
  // and bakes in the orientation tag, so portrait shots stay upright.
  //
  // Decoding via <img> rather than createImageBitmap keeps HEIC working on
  // iOS and gets EXIF orientation applied automatically.
  const shrinkImage = async file => {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()

      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))

      const ctx = canvas.getContext('2d')
      // Receipts print on white paper; flatten transparency so PNGs with
      // alpha don't come out as black blocks.
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1] || null
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // Shrinking is async, so a fast submit could otherwise race ahead of it and
  // see imageB64 still null. Submit awaits this before validating.
  let imagePending = null

  const takeImage = async input => {
    const file = input.files[0]
    if (!file) return clearImage()

    if (!file.type.startsWith('image/')) {
      setStatus('That file is not an image.', 'err')
      return clearImage()
    }

    setStatus('Reading image…')
    try {
      imageB64 = await shrinkImage(file)
      if (!imageB64) throw new Error('empty result')
      imageName.textContent = file.name || 'Photo'
      imageClear.hidden = false
      setStatus('')
    } catch {
      setStatus('Could not read that image.', 'err')
      clearImage()
    }
  }

  // Only one of the two inputs holds the attachment; picking from one
  // resets the other so they can't both be populated.
  imageInput.addEventListener('change', () => {
    cameraInput.value = ''
    imagePending = takeImage(imageInput)
  })
  cameraInput.addEventListener('change', () => {
    imageInput.value = ''
    imagePending = takeImage(cameraInput)
  })
  imageClear.addEventListener('click', clearImage)

  form.addEventListener('submit', async event => {
    event.preventDefault()

    // Wait for any in-flight image shrink so validation sees the real state.
    if (imagePending) await imagePending

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

    if (!name) {
      setStatus('Name is required.', 'err')
      return
    }

    // Message and image are each optional, but a receipt with neither is a
    // blank strip of paper, so require at least one.
    if (!body && !imageB64) {
      setStatus('Add a message or attach an image.', 'err')
      return
    }

    if (body.length > CHAR_LIMIT) {
      setStatus(`Message must be ${CHAR_LIMIT} characters or fewer.`, 'err')
      return
    }

    // Email stays optional, but a malformed one is worth catching here
    // rather than letting the server reject the whole submission.
    if (email && !EMAIL_PATTERN.test(email)) {
      setStatus("That email doesn't look right.", 'err')
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
      // Show what the server actually objected to. Collapsing every 4xx into
      // a generic "could not send" hides fixable problems from the person
      // who can fix them.
      if (!res.ok) {
        setStatus(json.error || 'Could not send — try again.', 'err')
        return
      }

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
