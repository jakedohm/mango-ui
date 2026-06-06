import { ASSISTANT_TOOLS, useAssistant } from '~/composables/useAssistant'

/*
  Real-time voice via the OpenAI Realtime API over WebRTC.

  We mint an ephemeral token server-side, open a peer connection with the mic,
  and exchange events over a data channel. Tool calls the voice model makes are
  executed through the SAME capability layer the text assistant uses, so voice
  edits still flow through the approval queue.
*/

// Convert chat-completions tool shape -> realtime tool shape (flattened).
function realtimeTools() {
  return ASSISTANT_TOOLS.map((t) => ({
    type: 'function',
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters
  }))
}

export const useRealtimeVoice = () => {
  const assistant = useAssistant()

  const status = useState('voice-status', () => 'idle') // idle|connecting|live|error
  const error = useState('voice-error', () => null)
  const muted = useState('voice-muted', () => false)

  let pc = null
  let dc = null
  let micStream = null
  let audioEl = null

  function note(text) {
    assistant.messages.value.push({ id: `v${Date.now()}`, role: 'note', content: text })
  }

  async function start() {
    if (status.value === 'live' || status.value === 'connecting') return
    status.value = 'connecting'
    error.value = null

    // 1. Ephemeral token
    let session, model
    try {
      const res = await $fetch('/api/assistant/realtime-token', {
        method: 'POST',
        body: { instructions: assistant.systemPrompt() }
      })
      if (res?.error) throw new Error(res.message || res.error)
      session = res.session
      model = res.model
    } catch (e) {
      status.value = 'error'
      error.value = e?.data?.message || e?.message || 'Could not start voice session'
      note(`Voice unavailable: ${error.value}`)
      return
    }

    const ephemeral = session?.client_secret?.value
    if (!ephemeral) {
      status.value = 'error'
      error.value = 'No realtime token returned'
      return
    }

    try {
      pc = new RTCPeerConnection()

      // Remote audio playback
      audioEl = document.createElement('audio')
      audioEl.autoplay = true
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]
      }

      // Mic
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream))

      // Events channel
      dc = pc.createDataChannel('oai-events')
      dc.onopen = () => configureSession()
      dc.onmessage = onEvent

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeral}`,
          'Content-Type': 'application/sdp'
        }
      })
      const answer = { type: 'answer', sdp: await sdpRes.text() }
      await pc.setRemoteDescription(answer)
      status.value = 'live'
    } catch (e) {
      status.value = 'error'
      error.value = e?.message || 'Voice connection failed'
      note(`Voice connection failed: ${error.value}`)
      stop()
    }
  }

  function configureSession() {
    send({
      type: 'session.update',
      session: {
        instructions: assistant.systemPrompt(),
        tools: realtimeTools(),
        tool_choice: 'auto',
        input_audio_transcription: { model: 'whisper-1' }
      }
    })
  }

  function send(obj) {
    if (dc && dc.readyState === 'open') dc.send(JSON.stringify(obj))
  }

  async function onEvent(e) {
    let evt
    try {
      evt = JSON.parse(e.data)
    } catch {
      return
    }

    switch (evt.type) {
      // Assistant spoken transcript
      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        if (evt.transcript) assistant.messages.value.push({ id: `va${Date.now()}`, role: 'assistant', content: evt.transcript })
        break
      // User speech transcript
      case 'conversation.item.input_audio_transcription.completed':
        if (evt.transcript) assistant.messages.value.push({ id: `vu${Date.now()}`, role: 'user', content: evt.transcript })
        break
      // Tool call requested by the voice model
      case 'response.function_call_arguments.done':
        await handleToolCall(evt)
        break
      case 'error':
        error.value = evt.error?.message || 'Realtime error'
        break
    }
  }

  async function handleToolCall(evt) {
    let args = {}
    try {
      args = evt.arguments ? JSON.parse(evt.arguments) : {}
    } catch {}
    const result = await assistant.execTool(evt.name, args)
    // Return the output to the model and let it continue speaking.
    send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: evt.call_id,
        output: JSON.stringify(result ?? {})
      }
    })
    send({ type: 'response.create' })
  }

  function toggleMute() {
    muted.value = !muted.value
    micStream?.getAudioTracks().forEach((t) => (t.enabled = !muted.value))
  }

  function stop() {
    try {
      dc?.close()
    } catch {}
    try {
      pc?.close()
    } catch {}
    micStream?.getTracks().forEach((t) => t.stop())
    if (audioEl) {
      audioEl.srcObject = null
      audioEl = null
    }
    dc = null
    pc = null
    micStream = null
    if (status.value !== 'error') status.value = 'idle'
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { status, error, muted, start, stop, toggleMute }
}
