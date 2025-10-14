/**
 * Event Router for OpenAI Realtime WebRTC Events
 *
 * Maps OpenAI Realtime event types from DataChannel to application state
 * and provides typed event handlers for the voice interface.
 */
export class RealtimeEventRouter {
    constructor(callbacks) {
        this.currentUserTranscript = "";
        this.currentAITranscript = "";
        this.currentToolCall = null;
        this.processedToolCalls = new Set();
        this.callbacks = callbacks;
    }
    /**
     * Route an incoming event to the appropriate handler
     */
    routeEvent(event) {
        // Log all events with their data (excluding audio)
        const logData = { ...event };
        if (logData.audio) {
            logData.audio = "[AUDIO_DATA_REMOVED_FOR_LOGGING]";
        }
        console.log("🔄 Routing event:", event.type, logData);
        // Debug: Log all event types to see what we're missing
        if (event.type.includes("input") || event.type.includes("transcription")) {
            console.log("🎤 INPUT/TRANSCRIPTION EVENT:", event.type, event);
        }
        // Log usage-related events specifically
        if (event.type.includes("usage") || event.type.includes("response") || event.type.includes("completion")) {
            console.log("📊 USAGE/RESPONSE EVENT:", event.type, logData);
        }
        switch (event.type) {
            case "session.created":
                this.handleSessionCreated(event);
                break;
            case "response.text.delta":
                this.handleTextDelta(event);
                break;
            case "response.audio.delta":
                this.handleAudioDelta(event);
                break;
            case "response.audio_transcript.delta":
                this.handleAudioTranscriptDelta(event);
                break;
            case "response.audio_transcript.done":
                this.handleAudioTranscriptDone(event);
                break;
            case "response.completed":
                this.handleResponseCompleted(event);
                break;
            case "input_audio_buffer.speech_started":
                this.handleSpeechStarted(event);
                break;
            case "input_audio_buffer.speech_stopped":
                this.handleSpeechStopped(event);
                break;
            case "input_audio_transcription.delta":
                this.handleInputTranscriptionDelta(event);
                break;
            case "input_audio_transcription.completed":
                this.handleInputTranscriptionCompleted(event);
                break;
            case "input_audio_buffer.committed":
                this.handleInputAudioBufferCommitted(event);
                break;
            case "conversation.item.created":
                this.handleConversationItemCreated(event);
                break;
            case "response.function_call_arguments.delta":
                this.handleToolCallDelta(event);
                break;
            case "response.function_call_arguments.done":
                this.handleToolCallDone(event);
                break;
            case "response.error":
                this.handleError(event);
                break;
            case "conversation.item.input_audio_transcription.completed":
                this.handleTranscriptionCompleted(event);
                break;
            case "conversation.item.completed":
                this.handleConversationItemCompleted(event);
                break;
            case "response.done":
                this.handleResponseDone(event);
                break;
            default:
                console.log("🔍 Unhandled event type:", event.type, event);
                // Check if this might contain usage information
                if (event.type.includes("usage") || event.type.includes("token") || event.type.includes("cost")) {
                    console.log("💰 Potential usage event:", event.type, event);
                }
                // Check if this might be a response event with usage data
                if (event.type.includes("response") && event.usage) {
                    console.log("📊 Response event with usage data:", event.type, event.usage);
                }
                // Check if this might be a user transcript event we haven't handled
                if (event.type.includes("input") || event.type.includes("user") || event.type.includes("transcript")) {
                    console.log("🎤 POTENTIAL USER TRANSCRIPT EVENT:", event.type, event);
                    // Try to extract transcript from various possible fields
                    const transcriptEvent = event;
                    const possibleTranscript = transcriptEvent.transcript ||
                        transcriptEvent.text ||
                        transcriptEvent.delta ||
                        transcriptEvent.content ||
                        transcriptEvent.message;
                    if (possibleTranscript && typeof possibleTranscript === "string") {
                        console.log("📝 Found potential transcript text:", possibleTranscript);
                        const transcript = {
                            id: crypto.randomUUID(),
                            role: "user",
                            text: possibleTranscript,
                            type: "final",
                            timestamp: Date.now(),
                        };
                        this.callbacks.onTranscript?.(transcript);
                    }
                }
                break;
        }
    }
    handleSessionCreated(event) {
        console.log("🎉 Session created event received:", event);
        const session = event.session;
        const sessionId = session?.id;
        console.log("🎉 Extracted session ID:", sessionId);
        console.log("🎉 Has onSessionCreated callback:", !!this.callbacks.onSessionCreated);
        if (sessionId) {
            console.log("🎉 Calling onSessionCreated callback with:", sessionId);
            this.callbacks.onSessionCreated?.(sessionId, event.session);
            this.callbacks.onLatencyMark?.("sessionCreated", Date.now());
            console.log("🎉 Session created callback completed");
        }
        else {
            console.log("❌ No session ID found in event");
        }
    }
    handleTextDelta(event) {
        const delta = event.delta;
        if (delta) {
            this.currentAITranscript += delta;
            console.log("📝 Text delta:", delta);
            console.log("📝 Current AI transcript:", this.currentAITranscript);
            this.callbacks.onPartialTranscript?.(this.currentAITranscript);
        }
    }
    handleAudioDelta(event) {
        const delta = event.delta;
        if (delta) {
            console.log("🎵 Audio delta received");
            // Convert base64 audio data to Int16Array if needed
            try {
                const audioData = this.base64ToInt16Array(delta);
                this.callbacks.onAudioResponse?.(audioData);
                this.callbacks.onLatencyMark?.("firstAudio", Date.now());
            }
            catch (error) {
                console.error("❌ Failed to process audio delta:", error);
            }
        }
    }
    handleResponseCompleted(event) {
        console.log("✅ Response completed - Full event data:", JSON.stringify(event, null, 2));
        // Check if the event contains usage information (either directly or in response)
        const responseEvent = event;
        const usage = responseEvent.usage || responseEvent.response?.usage;
        if (usage) {
            console.log("📊 Usage information received:", usage);
            this.callbacks.onUsageUpdate?.(usage);
        }
        else {
            console.log("⚠️ No usage information found in response.completed event");
        }
        // Log all properties of the event to see what's available
        console.log("🔍 Event properties:", Object.keys(event));
        if (event.response) {
            console.log("📋 Response object:", event.response);
        }
        // Create final transcript if we have accumulated text
        if (this.currentAITranscript.trim()) {
            const transcript = {
                id: crypto.randomUUID(),
                role: "assistant",
                text: this.currentAITranscript.trim(),
                type: "final",
                timestamp: Date.now(),
            };
            this.callbacks.onTranscript?.(transcript);
            this.currentAITranscript = ""; // Reset for next response
        }
        this.callbacks.onResponseCompleted?.();
    }
    handleResponseDone(event) {
        console.log("✅ Response done - Full event data:", JSON.stringify(event, null, 2));
        // Check if the event contains usage information (either directly or in response)
        const responseEvent = event;
        const usage = responseEvent.usage || responseEvent.response?.usage;
        if (usage) {
            console.log("📊 Usage information received in response.done:", usage);
            this.callbacks.onUsageUpdate?.(usage);
        }
        else {
            console.log("⚠️ No usage information found in response.done event");
        }
        // Log all properties of the event to see what's available
        console.log("🔍 Event properties:", Object.keys(event));
        if (event.response) {
            console.log("📋 Response object:", event.response);
        }
    }
    handleSpeechStarted(_event) {
        console.log("🎤 Speech started");
        this.callbacks.onSpeechStarted?.();
        this.callbacks.onLatencyMark?.("speechStarted", Date.now());
    }
    handleSpeechStopped(_event) {
        console.log("🔇 Speech stopped");
        this.callbacks.onSpeechStopped?.();
        this.callbacks.onLatencyMark?.("speechStopped", Date.now());
    }
    handleToolCallDelta(event) {
        const callId = event.call_id;
        const delta = event.delta;
        if (callId && delta) {
            console.log("🔧 Tool call delta:", callId, delta);
            if (!this.currentToolCall || this.currentToolCall.callId !== callId) {
                this.currentToolCall = { callId, arguments: "" };
            }
            this.currentToolCall.arguments += delta;
            this.callbacks.onToolCallDelta?.(callId, delta);
        }
    }
    handleToolCallDone(event) {
        const callId = event.call_id;
        const argsStr = this.currentToolCall?.callId === callId ? this.currentToolCall?.arguments : "";
        if (callId && argsStr) {
            // Check if we've already processed this tool call
            if (this.processedToolCalls.has(callId)) {
                console.log("⚠️ Duplicate tool call detected, skipping:", callId);
                return;
            }
            console.log("🔧 Tool call done:", callId, argsStr);
            try {
                const parsedArgs = JSON.parse(argsStr);
                const toolCall = {
                    id: callId,
                    name: event.name || "unknown",
                    arguments: parsedArgs,
                    timestamp: Date.now(),
                };
                // Mark this tool call as processed
                this.processedToolCalls.add(callId);
                this.callbacks.onToolCall?.(toolCall);
                this.callbacks.onToolCallDone?.(callId, parsedArgs);
                this.callbacks.onLatencyMark?.("toolCallDone", Date.now());
            }
            catch (error) {
                console.error("❌ Failed to parse tool call arguments:", error);
                this.callbacks.onError?.(error);
            }
            // Reset current tool call
            this.currentToolCall = null;
        }
    }
    handleError(event) {
        console.error("❌ Response error:", event);
        this.callbacks.onError?.(event);
    }
    handleConversationItemCreated(event) {
        console.log("💬 Conversation item created:", event);
        const item = event.item;
        if (item?.type === "function_call") {
            const callId = item.id || crypto.randomUUID();
            // Check if we've already processed this tool call
            if (this.processedToolCalls.has(callId)) {
                console.log("⚠️ Duplicate function call detected, skipping:", callId);
                return;
            }
            const toolCall = {
                id: callId,
                name: item.name || "unknown",
                arguments: item.arguments || {},
                timestamp: Date.now(),
            };
            // Mark this tool call as processed
            this.processedToolCalls.add(callId);
            this.callbacks.onToolCall?.(toolCall);
        }
        else if (item?.type === "message" && item?.role === "user") {
            // Handle user message/transcript
            console.log("👤 User message created:", item);
            const transcriptText = item.transcript || item.formatted?.text;
            if (transcriptText) {
                const transcript = {
                    id: item.id || crypto.randomUUID(),
                    role: "user",
                    text: transcriptText,
                    type: "final",
                    timestamp: Date.now(),
                };
                this.callbacks.onTranscript?.(transcript);
            }
        }
    }
    handleTranscriptionCompleted(event) {
        console.log("📝 Transcription completed:", event);
        const item = event.item;
        if (item?.transcript) {
            const transcript = {
                id: item.id || crypto.randomUUID(),
                role: "user",
                text: item.transcript,
                type: "final",
                timestamp: item.timestamp || Date.now(),
            };
            this.callbacks.onTranscript?.(transcript);
            this.callbacks.onLatencyMark?.("transcriptionCompleted", Date.now());
        }
    }
    handleConversationItemCompleted(event) {
        console.log("✅ Conversation item completed:", event);
        const item = event.item;
        if (item?.type === "message" && item?.role === "assistant") {
            if (item.formatted?.text) {
                const transcript = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: item.formatted.text,
                    type: "final",
                    timestamp: Date.now(),
                };
                this.callbacks.onTranscript?.(transcript);
            }
        }
    }
    /**
     * Handle input audio transcription delta events (user speech)
     */
    handleInputTranscriptionDelta(event) {
        const delta = event.delta;
        if (delta) {
            this.currentUserTranscript += delta;
            console.log("🎤 Input transcript delta:", delta);
            console.log("🎤 Current input transcript:", this.currentUserTranscript);
            this.callbacks.onPartialTranscript?.(this.currentUserTranscript);
        }
    }
    /**
     * Handle input audio transcription completed events (user speech)
     */
    handleInputTranscriptionCompleted(event) {
        console.log("✅ Input transcription completed");
        if (this.currentUserTranscript.trim()) {
            const transcript = {
                id: crypto.randomUUID(),
                role: "user",
                text: this.currentUserTranscript.trim(),
                type: "final",
                timestamp: Date.now(),
            };
            this.callbacks.onTranscript?.(transcript);
            this.currentUserTranscript = ""; // Reset for next response
        }
    }
    /**
     * Handle input audio buffer committed events (user speech)
     */
    handleInputAudioBufferCommitted(event) {
        console.log("📝 Input audio buffer committed:", event);
        // This event indicates the user's speech has been processed
        // We might need to wait for a transcription event or create one from the buffer
        const itemId = event.item_id;
        if (itemId) {
            console.log("🎤 Audio buffer committed for item:", itemId);
            // The transcription might come in a separate event
        }
    }
    /**
     * Handle audio transcript delta events
     */
    handleAudioTranscriptDelta(event) {
        const delta = event.delta;
        if (delta) {
            this.currentAITranscript += delta;
            console.log("📝 Audio transcript delta:", delta);
            console.log("📝 Current AI transcript:", this.currentAITranscript);
            this.callbacks.onPartialTranscript?.(this.currentAITranscript);
        }
    }
    /**
     * Handle audio transcript done events
     */
    handleAudioTranscriptDone(event) {
        console.log("✅ Audio transcript completed");
        if (this.currentAITranscript.trim()) {
            const transcript = {
                id: crypto.randomUUID(),
                role: "assistant",
                text: this.currentAITranscript.trim(),
                type: "final",
                timestamp: Date.now(),
            };
            this.callbacks.onTranscript?.(transcript);
            this.currentAITranscript = ""; // Reset for next response
        }
    }
    /**
     * Convert base64 encoded audio data to Int16Array
     */
    base64ToInt16Array(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Int16Array(bytes.buffer);
    }
    /**
     * Reset the router state
     */
    reset() {
        this.currentUserTranscript = "";
        this.currentAITranscript = "";
        this.currentToolCall = null;
        this.processedToolCalls.clear();
    }
}
