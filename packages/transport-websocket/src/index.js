// Audio conversion utilities
function pcmToBase64(pcm) {
    // Convert Int16Array to Uint8Array (little-endian)
    const buffer = new ArrayBuffer(pcm.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcm.length; i++) {
        view.setInt16(i * 2, pcm[i], true); // little-endian
    }
    const uint8Array = new Uint8Array(buffer);
    // Convert to base64
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}
function base64ToPcm(base64) {
    // Convert base64 to Uint8Array
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        uint8Array[i] = binary.charCodeAt(i);
    }
    // Convert Uint8Array to Int16Array (little-endian)
    const pcm = new Int16Array(uint8Array.length / 2);
    const view = new DataView(uint8Array.buffer);
    for (let i = 0; i < pcm.length; i++) {
        pcm[i] = view.getInt16(i * 2, true); // little-endian
    }
    return pcm;
}
export function createWebSocketTransport(config, deps) {
    let websocket = null;
    let audioElement = null;
    let micStream = null;
    let eventHandler = null;
    let sessionId = null;
    let clientSecretValue = null;
    let model = null;
    let isConnected = false;
    let audioContext = null;
    let audioWorkletNode = null;
    return {
        kind: "websocket",
        async connect(opts) {
            try {
                console.log("🚀 Starting WebSocket connection...");
                eventHandler = opts.onEvent;
                // 1. Get ephemeral secret from session route (same as WebRTC)
                console.log("📡 Fetching ephemeral secret...");
                const sessionData = await deps.getSessionToken();
                clientSecretValue = sessionData.client_secret.value;
                sessionId = sessionData.session_id;
                model = sessionData.model;
                console.log("✅ Ephemeral secret received", { session_id: sessionId, model, expires_at: sessionData.client_secret.expires_at });
                // 2. Create WebSocket connection
                console.log("🔗 Creating WebSocket connection...");
                const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
                websocket = new WebSocket(wsUrl);
                websocket.onopen = () => {
                    console.log("✅ WebSocket connection opened");
                    isConnected = true;
                    // Send authentication
                    websocket.send(JSON.stringify({
                        type: "session.update",
                        session: {
                            modalities: ["text", "audio"],
                            instructions: config.instructions || "You are a helpful AI assistant.",
                            voice: config.voice || "alloy",
                            input_audio_format: "pcm16",
                            output_audio_format: "pcm16",
                            input_audio_transcription: {
                                model: "whisper-1",
                            },
                            turn_detection: {
                                type: "server_vad",
                                threshold: 0.5,
                                prefix_padding_ms: 300,
                                silence_duration_ms: 200,
                            },
                            tools: config.tools || [],
                        },
                    }));
                    // Send authorization
                    websocket.send(JSON.stringify({
                        type: "session.update",
                        session: {
                            client_secret: clientSecretValue,
                        },
                    }));
                    // Trigger session created event
                    if (eventHandler) {
                        eventHandler({
                            type: "session.created",
                            session: { id: sessionId },
                        });
                    }
                };
                websocket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log("📨 WebSocket message:", message.type, message);
                        // Handle different message types
                        switch (message.type) {
                            case "session.created":
                                console.log("🎉 Session created via WebSocket");
                                if (eventHandler) {
                                    eventHandler(message);
                                }
                                break;
                            case "conversation.item.created":
                                if (eventHandler) {
                                    eventHandler(message);
                                }
                                break;
                            case "response.audio.delta":
                                // Handle audio response
                                if (message.delta && message.delta.type === "audio.delta") {
                                    const audioData = base64ToPcm(message.delta.audio);
                                    if (eventHandler) {
                                        eventHandler({
                                            type: "response.audio.delta",
                                            audio: audioData,
                                        });
                                    }
                                }
                                break;
                            case "response.text.delta":
                                // Handle text response
                                if (message.delta && message.delta.type === "text.delta") {
                                    if (eventHandler) {
                                        eventHandler({
                                            type: "response.text.delta",
                                            text: message.delta.text,
                                        });
                                    }
                                }
                                break;
                            case "response.done":
                                if (eventHandler) {
                                    eventHandler({
                                        type: "response.done",
                                    });
                                }
                                break;
                            case "input_audio_buffer.speech_started":
                                if (eventHandler) {
                                    eventHandler({
                                        type: "speech.started",
                                    });
                                }
                                break;
                            case "input_audio_buffer.speech_stopped":
                                if (eventHandler) {
                                    eventHandler({
                                        type: "speech.stopped",
                                    });
                                }
                                break;
                            case "conversation.item.input_audio_transcription.completed":
                                if (eventHandler) {
                                    eventHandler({
                                        type: "conversation.item.input_audio_transcription.completed",
                                        transcription: message.transcription,
                                    });
                                }
                                break;
                            case "response.function_call_arguments.delta":
                                if (eventHandler) {
                                    eventHandler({
                                        type: "response.function_call_arguments.delta",
                                        delta: message.delta,
                                    });
                                }
                                break;
                            default:
                                // Pass through other events
                                if (eventHandler) {
                                    eventHandler(message);
                                }
                                break;
                        }
                    }
                    catch (error) {
                        console.warn("⚠️ Non-JSON WebSocket message:", event.data);
                    }
                };
                websocket.onclose = (event) => {
                    console.log("❌ WebSocket connection closed", event);
                    isConnected = false;
                };
                websocket.onerror = (error) => {
                    console.error("❌ WebSocket error:", error);
                    if (eventHandler) {
                        eventHandler({
                            type: "error",
                            error: error,
                        });
                    }
                };
                // 3. Set up audio playback
                console.log("🔊 Setting up audio playback...");
                audioElement = document.createElement("audio");
                audioElement.autoplay = true;
                audioElement.playsInline = true;
                audioElement.style.display = "none";
                document.body.appendChild(audioElement);
                // Set up audio context for playback
                audioContext = new AudioContext({ sampleRate: 24000 });
                // 4. Add microphone track
                console.log("🎤 Requesting microphone access...");
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 24000,
                        channelCount: 1,
                    },
                });
                console.log("✅ Microphone access granted");
                // Set up audio processing for microphone
                const micAudioContext = new AudioContext({ sampleRate: 24000 });
                const source = micAudioContext.createMediaStreamSource(micStream);
                // Create a ScriptProcessorNode for audio processing
                const processor = micAudioContext.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (event) => {
                    if (isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
                        const inputBuffer = event.inputBuffer;
                        const inputData = inputBuffer.getChannelData(0);
                        // Convert Float32Array to Int16Array
                        const pcmData = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                        }
                        // Convert to base64 and send
                        const base64Audio = pcmToBase64(pcmData);
                        websocket.send(JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: base64Audio,
                        }));
                    }
                };
                source.connect(processor);
                processor.connect(micAudioContext.destination);
                console.log("✅ WebSocket connection setup complete");
            }
            catch (error) {
                console.error("❌ WebSocket connection failed:", error);
                throw error;
            }
        },
        send(event) {
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.send(JSON.stringify(event));
                console.log("📤 Sent WebSocket message:", event.type);
            }
            else {
                console.warn("⚠️ WebSocket not open, cannot send message:", event.type);
            }
        },
        async close() {
            console.log("🧹 Cleaning up WebSocket connection...");
            // Stop all tracks
            if (micStream) {
                micStream.getTracks().forEach((track) => {
                    track.stop();
                    console.log("🛑 Audio track stopped");
                });
                micStream = null;
            }
            // Close WebSocket connection
            if (websocket) {
                websocket.close();
                console.log("🔌 WebSocket connection closed");
                websocket = null;
            }
            // Close audio context
            if (audioContext) {
                await audioContext.close();
                console.log("🔊 Audio context closed");
                audioContext = null;
            }
            // Remove audio element
            if (audioElement && audioElement.parentNode) {
                audioElement.parentNode.removeChild(audioElement);
                console.log("🔊 Audio element removed");
                audioElement = null;
            }
            // Clear references
            eventHandler = null;
            sessionId = null;
            clientSecretValue = null;
            model = null;
            isConnected = false;
            audioWorkletNode = null;
        },
    };
}
