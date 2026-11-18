import { useEffect, useRef, useState } from 'react';
import { PROOF_AUDIO_TYPES, PROOF_MAX_AUDIO_BYTES, PROOF_MAX_AUDIO_SECONDS } from '@purrpose/shared';
import { DoodleButton } from '../ui/index.js';
import { t } from '../../i18n/index.js';
import { isNativeApp } from '../../lib/platform.js';

export type ProofAudioType = (typeof PROOF_AUDIO_TYPES)[number];
export interface RecordedVoice {
  type: ProofAudioType;
  /** Base64, no data: prefix. */
  data: string;
  url: string;
  seconds: number;
}

/** Can this browser / app record a voice note at all? */
export function canRecordVoice(): boolean {
  // The Android app has no microphone permission (Cafe Bazaar rule): voice proofs are website-only.
  if (isNativeApp()) return false;
  return typeof window !== 'undefined' && 'MediaRecorder' in window && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** The first format this browser records that the server takes (Android: webm, iPhone: mp4). */
function pickFormat(): { mime: string; type: ProofAudioType } | null {
  const options: Array<[string, ProofAudioType]> = [
    ['audio/webm;codecs=opus', 'audio/webm'],
    ['audio/webm', 'audio/webm'],
    ['audio/mp4', 'audio/mp4'],
    ['audio/ogg;codecs=opus', 'audio/ogg'],
    ['audio/aac', 'audio/aac'],
  ];
  for (const [mime, type] of options) {
    if (MediaRecorder.isTypeSupported?.(mime)) return { mime, type };
  }
  return null;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Record up to a minute of voice for a proof. The phone asks for the microphone the first
 * time (the caller shows its own explanation before that).
 */
export function VoiceRecorder({
  voice,
  onVoice,
  onError,
  autoStart = false,
}: {
  voice: RecordedVoice | null;
  onVoice: (v: RecordedVoice | null) => void;
  onError: (text: string) => void;
  /** Start recording right away (the player already tapped "add a voice note"). */
  autoStart?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);

  const stopTracks = () => {
    stream.current?.getTracks().forEach(tr => tr.stop());
    stream.current = null;
  };
  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
      stopTracks();
    },
    [],
  );
  useEffect(() => () => {
    if (voice) URL.revokeObjectURL(voice.url);
  }, [voice]);

  const start = async () => {
    const format = pickFormat();
    if (!format) {
      onError(t('This device can’t record a voice note here.'));
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      onError(
        denied
          ? t('Purrpose may not use the microphone. Allow it in your phone’s settings (Apps → Purrpose → Permissions) and try again.')
          : t('The microphone could not be started.'),
      );
      return;
    }
    const chunks: BlobPart[] = [];
    const r = new MediaRecorder(stream.current, { mimeType: format.mime, audioBitsPerSecond: 48_000 });
    r.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    r.onstop = async () => {
      window.clearInterval(timer.current);
      setRecording(false);
      stopTracks();
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      const blob = new Blob(chunks, { type: format.type });
      if (blob.size === 0) return;
      if (blob.size > PROOF_MAX_AUDIO_BYTES) {
        onError(t('That voice note is too long. Keep it under a minute.'));
        return;
      }
      onVoice({ type: format.type, data: await toBase64(blob), url: URL.createObjectURL(blob), seconds });
    };
    rec.current = r;
    startedAt.current = Date.now();
    setElapsed(0);
    setRecording(true);
    r.start(1000);
    timer.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(s);
      if (s >= PROOF_MAX_AUDIO_SECONDS && r.state === 'recording') r.stop();
    }, 250);
  };

  const started = useRef(false);
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void start();
    }
  });

  const stop = () => {
    if (rec.current && rec.current.state === 'recording') rec.current.stop();
  };

  if (voice) {
    return (
      <div className="proof-voice">
        <audio controls preload="metadata" src={voice.url} />
        <button type="button" className="linklike" onClick={() => onVoice(null)}>
          {t('Remove voice note')}
        </button>
      </div>
    );
  }
  if (recording) {
    const left = PROOF_MAX_AUDIO_SECONDS - elapsed;
    return (
      <div className="proof-voice is-recording" role="status">
        <span className="rec-dot" aria-hidden="true" />
        <span className="ltr">{`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`}</span>
        <span className="muted" style={{ fontSize: 12.5 }}>{t('{n}s left', { n: Math.max(0, left) })}</span>
        <DoodleButton variant="primary" onClick={stop}>
          {t('Stop')}
        </DoodleButton>
      </div>
    );
  }
  return (
    <DoodleButton onClick={() => void start()}>
      🎙️ {t('Record a voice note')}
    </DoodleButton>
  );
}
