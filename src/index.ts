import "./styles.css";
import { StreamVideoClient, User } from "@stream-io/video-client";
import { cleanupParticipant, renderParticipant } from "./participant";
import { renderControls } from "./controls";
import {
  renderAudioDeviceSelector,
  renderAudioOutputSelector,
  renderVideoDeviceSelector,
  renderVolumeControl,
} from "./device-selector";
import { isMobile } from "./mobile";
import { ClosedCaptionManager } from "./closed-captions";

const apiKey = "mmhfdzb5evj2";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0Foc29rYV9UYW5vIiwidXNlcl9pZCI6IkFoc29rYV9UYW5vIiwidmFsaWRpdHlfaW5fc2Vjb25kcyI6NjA0ODAwLCJpYXQiOjE3NDE5NDQ5MjUsImV4cCI6MTc0MjU0OTcyNX0.UgTaraUlO8TwGYSowcr2ZuPdAi5TqOwuvXbxkjHib50";
const user: User = { id: "Ahsoka_Tano" };

const client = new StreamVideoClient({
  apiKey,
  token,
  user,
  options: { logLevel: "info" },
});

const callId = "PuuoKM6ObTy6";
const call = client.call("default", callId);

call.screenShare.enableScreenShareAudio();
call.screenShare.setSettings({
  maxFramerate: 10,
  maxBitrate: 1500000,
});

const container = document.getElementById("call-controls")!;

// render mic and camera controls
const controls = renderControls(call);
container.appendChild(controls.audioButton);
container.appendChild(controls.videoButton);
container.appendChild(controls.screenShareButton);

container.appendChild(renderAudioDeviceSelector(call));

// render device selectors
if (isMobile.any()) {
  container.appendChild(controls.flipButton);
} else {
  container.appendChild(renderVideoDeviceSelector(call));
}

const audioOutputSelector = renderAudioOutputSelector(call);
if (audioOutputSelector) {
  container.appendChild(audioOutputSelector);
}

container.appendChild(renderVolumeControl(call));

// Closed caption controls
const closedCaptionManager = new ClosedCaptionManager(call);
container.appendChild(closedCaptionManager.renderToggleElement());

const captionContainer = document.getElementById("closed-captions");
captionContainer?.appendChild(closedCaptionManager.renderCaptionContainer());

call.join({ create: true }).then(() => {
  call.camera.enable();
  call.microphone.enable();
});

window.addEventListener("beforeunload", () => {
  call.leave();
});

const parentContainer = document.getElementById("participants")!;
call.setViewport(parentContainer);

call.state.participants$.subscribe((participants) => {
  // render / update existing participants
  participants.forEach((participant) => {
    renderParticipant(call, participant, parentContainer);
  });

  // Remove stale elements for stale participants
  parentContainer
    .querySelectorAll<HTMLMediaElement>("video, audio")
    .forEach((el) => {
      const sessionId = el.dataset.sessionId!;
      const participant = participants.find((p) => p.sessionId === sessionId);
      if (!participant) {
        cleanupParticipant(sessionId);
        el.remove();
      }
    });
});
