import { Transport, ClientIdentity } from "@thrivereflections/realtime-contracts";

export interface WebRTCTransportConfig {
  voice?: string;
  persona?: string;
  instructions?: string;
  capabilities?: string[];
  featureFlags?: {
    memory?: string;
  };
  tools?: Array<{
    type: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface WebRTCTransportDeps {
  getSessionToken: () => Promise<{
    client_secret: { value: string; expires_at: string };
    session_id: string;
    model: string;
  }>;
}

export function createWebRTCTransport(config: WebRTCTransportConfig, deps: WebRTCTransportDeps): Transport {
  let peerConnection: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let audioElement: HTMLAudioElement | null = null;
  let micStream: MediaStream | null = null;
  let eventHandler: ((event: unknown) => void) | null = null;
  let sessionId: string | null = null;
  let clientSecretValue: string | null = null;
  let model: string | null = null;

  return {
    kind: "webrtc",

    async connect(opts: { token: string; onEvent: (event: unknown) => void; identity?: ClientIdentity }) {
      try {
        console.log("🚀 Starting pure WebRTC connection...");
        eventHandler = opts.onEvent;

        // 1. Get ephemeral secret from session route
        console.log("📡 Fetching ephemeral secret...");
        const sessionData = await deps.getSessionToken();
        clientSecretValue = sessionData.client_secret.value;
        sessionId = sessionData.session_id;
        model = sessionData.model;
        console.log("✅ Ephemeral secret received", {
          session_id: sessionId,
          model,
          expires_at: sessionData.client_secret.expires_at,
        });

        // 2. Create RTCPeerConnection with ICE servers
        console.log("🔗 Creating RTCPeerConnection...");
        peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
        });

        // 3. Create DataChannel for events
        console.log("📡 Creating oai-events DataChannel...");
        dataChannel = peerConnection.createDataChannel("oai-events", {
          ordered: true,
        });

        // Set up DataChannel event handling
        dataChannel.onopen = () => {
          console.log("📡 Data channel opened");
          console.log("🔍 Session ID available:", !!sessionId);
          console.log("🔍 Event handler available:", !!eventHandler);

          if (sessionId && eventHandler) {
            console.log("🎉 Data channel opened, triggering session created event:", sessionId);
            const sessionEvent: any = {
              type: "session.created",
              session: { id: sessionId },
            };

            // Add identity metadata (non-PII only)
            if (opts.identity) {
              sessionEvent.session.metadata = {
                identityLevel: opts.identity.level,
                // Only include non-PII identifiers
                ...(opts.identity.anonymousId && { anonymousId: opts.identity.anonymousId }),
                ...(opts.identity.pseudonymousId && { pseudonymousId: opts.identity.pseudonymousId }),
                ...(opts.identity.consent && { consent: opts.identity.consent }),
              };
            }

            eventHandler(sessionEvent);
            console.log("🎉 Session created event sent from onopen");
          }
        };

        dataChannel.onclose = (event) => {
          console.log("❌ oai-events DataChannel closed", event);
          // Try to reconnect if the connection was established
          if (peerConnection && peerConnection.connectionState === "connected") {
            console.log("🔄 Attempting to reconnect DataChannel...");
            const newDataChannel = peerConnection.createDataChannel("oai-events", {
              ordered: true,
            });

            newDataChannel.onopen = () => {
              console.log("✅ DataChannel reconnected");
              if (sessionId && eventHandler) {
                const sessionEvent: any = {
                  type: "session.created",
                  session: { id: sessionId },
                };

                // Add identity metadata (non-PII only)
                if (opts.identity) {
                  sessionEvent.session.metadata = {
                    identityLevel: opts.identity.level,
                    // Only include non-PII identifiers
                    ...(opts.identity.anonymousId && { anonymousId: opts.identity.anonymousId }),
                    ...(opts.identity.pseudonymousId && { pseudonymousId: opts.identity.pseudonymousId }),
                    ...(opts.identity.consent && { consent: opts.identity.consent }),
                  };
                }

                eventHandler(sessionEvent);
              }
            };

            newDataChannel.onclose = () => {
              console.log("❌ Reconnected DataChannel closed");
            };

            newDataChannel.onerror = () => {
              console.error("❌ Reconnected DataChannel error");
            };

            newDataChannel.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);
                console.log("📨 DataChannel event:", message.type, message);
                if (eventHandler) {
                  eventHandler(message);
                }
              } catch (error) {
                console.warn("⚠️ Non-JSON DataChannel message:", event.data);
              }
            };

            dataChannel = newDataChannel;
          }
        };

        dataChannel.onerror = (error) => {
          console.error("❌ DataChannel error:", error);
        };

        dataChannel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("📨 DataChannel event:", message.type, message);

            if (eventHandler) {
              eventHandler(message);
            }
          } catch (error) {
            console.warn("⚠️ Non-JSON DataChannel message:", event.data);
          }
        };

        // 4. Set up audio playback
        console.log("🔊 Setting up audio playback...");
        audioElement = document.createElement("audio");
        audioElement.autoplay = true;
        (audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);

        peerConnection.ontrack = (event) => {
          console.log("🎵 Remote audio track received");
          if (audioElement) {
            audioElement.srcObject = event.streams[0];
          }
        };

        // 5. Add microphone track
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

        // Add all audio tracks to peer connection
        micStream.getTracks().forEach((track) => {
          console.log("🎤 Adding microphone track to peer connection");
          peerConnection!.addTrack(track, micStream!);
        });

        // 6. Create SDP offer
        console.log("📤 Creating SDP offer...");
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });

        await peerConnection.setLocalDescription(offer);
        console.log("✅ SDP offer created and set as local description");

        // 7. Send SDP offer to OpenAI
        console.log("📡 Sending SDP offer to OpenAI...");
        const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecretValue}`,
            "Content-Type": "application/sdp",
            "OpenAI-Beta": "realtime=v1",
          },
          body: offer.sdp,
        });

        if (!sdpResponse.ok) {
          const errorText = await sdpResponse.text();
          throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText}`);
        }

        const sdpAnswer = await sdpResponse.text();
        console.log("✅ SDP answer received from OpenAI");

        // 8. Set remote description
        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: sdpAnswer,
        });
        console.log("✅ Remote description set");

        // 9. Monitor ICE connection state
        peerConnection.oniceconnectionstatechange = () => {
          console.log("🧊 ICE connection state:", peerConnection!.iceConnectionState);

          if (
            peerConnection!.iceConnectionState === "connected" ||
            peerConnection!.iceConnectionState === "completed"
          ) {
            console.log("✅ WebRTC connection established");

            if (sessionId && eventHandler) {
              console.log("🎉 ICE connected, triggering session created event:", sessionId);
              const sessionEvent: any = {
                type: "session.created",
                session: { id: sessionId },
              };

              // Add identity metadata (non-PII only)
              if (opts.identity) {
                sessionEvent.session.metadata = {
                  identityLevel: opts.identity.level,
                  // Only include non-PII identifiers
                  ...(opts.identity.anonymousId && { anonymousId: opts.identity.anonymousId }),
                  ...(opts.identity.pseudonymousId && { pseudonymousId: opts.identity.pseudonymousId }),
                  ...(opts.identity.consent && { consent: opts.identity.consent }),
                };
              }

              eventHandler(sessionEvent);
              console.log("🎉 Session created event sent from ICE connection");
            }
          } else if (
            peerConnection!.iceConnectionState === "failed" ||
            peerConnection!.iceConnectionState === "disconnected"
          ) {
            console.error("❌ WebRTC connection failed");
          }
        };

        // Additional diagnostic monitoring
        peerConnection.onicegatheringstatechange = () => {
          console.log("🧊 ICE gathering state:", peerConnection!.iceGatheringState);
        };

        peerConnection.onconnectionstatechange = () => {
          console.log("🔗 Connection state:", peerConnection!.connectionState);
        };

        peerConnection.onsignalingstatechange = () => {
          console.log("📡 Signaling state changed to:", peerConnection!.signalingState);
        };

        // 10. Optional: Send initial greeting to test the connection
        if (dataChannel.readyState === "open") {
          console.log("👋 Sending initial greeting...");
          dataChannel.send(
            JSON.stringify({
              type: "response.create",
              response: {
                instructions: "Hello! I'm ready to chat.",
              },
            })
          );
        }

        console.log("✅ WebRTC connection setup complete");
      } catch (error) {
        console.error("❌ WebRTC connection failed:", error);
        throw error;
      }
    },

    send(event: unknown) {
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(JSON.stringify(event));
        console.log("📤 Sent message:", (event as any).type);
      } else {
        console.warn("⚠️ DataChannel not open, cannot send message:", (event as any).type);
      }
    },

    async close() {
      console.log("🧹 Cleaning up WebRTC connection...");

      // Stop all tracks
      if (micStream) {
        micStream.getTracks().forEach((track) => {
          track.stop();
          console.log("🛑 Audio track stopped");
        });
        micStream = null;
      }

      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
        console.log("🔌 Peer connection closed");
        peerConnection = null;
      }

      // Remove audio element
      if (audioElement && audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement);
        console.log("🔊 Audio element removed");
        audioElement = null;
      }

      // Clear references
      dataChannel = null;
      eventHandler = null;
      sessionId = null;
      clientSecretValue = null;
      model = null;
    },
  };
}
