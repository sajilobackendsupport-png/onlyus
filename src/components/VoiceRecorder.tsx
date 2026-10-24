import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';
import { soundService } from '../services/sound';

interface VoiceRecorderProps {
  onSendVoice: (mediaUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported by your browser.');
      return;
    }

    try {
      soundService.playMicBeep();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic permission denied or error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : 'Unable to access microphone: ' + err.message
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      soundService.playMicBeep();
    }
  };

  const togglePreviewPlay = () => {
    if (!audioUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      onSendVoice(base64Audio, Math.max(1, duration));
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs text-red-200">
        <p>{errorMessage}</p>
        <button
          onClick={onCancel}
          className="self-end px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-purple-950/40 backdrop-blur-md border border-rose-500/30 rounded-2xl w-full">
      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-rose-500/20 text-rose-400">
            <span className="absolute w-full h-full rounded-full bg-rose-500/30 animate-ping" />
            <Mic className="w-5 h-5 relative z-10" />
          </div>
        ) : (
          <button
            onClick={togglePreviewPlay}
            className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center hover:bg-rose-500/30"
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        )}

        {/* Live animated waveform bars */}
        <div className="flex items-center gap-0.5 h-6">
          {[40, 70, 30, 90, 60, 100, 50, 80, 40, 90, 65, 85].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isRecording
                  ? 'bg-rose-400 animate-pulse'
                  : 'bg-rose-300/60'
              }`}
              style={{
                height: isRecording ? `${Math.max(20, (h * (1 + Math.sin(duration * 2 + i)))) % 100}%` : `${h * 0.6}%`,
              }}
            />
          ))}
        </div>

        <span className="text-xs font-mono font-medium text-rose-200 ml-1">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          title="Discard voice message"
          className="p-2 text-rose-300/70 hover:text-rose-200 hover:bg-white/5 rounded-full transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-950/40"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Done
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-500/25"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        )}
      </div>
    </div>
  );
};
