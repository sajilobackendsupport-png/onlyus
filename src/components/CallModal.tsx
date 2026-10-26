import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { webrtcService } from '../services/webrtcService';
import { soundService } from '../services/sound';
import { callSignalingService } from '../services/callSignalingService';
import { getAvatarDetails } from '../utils/avatars';

interface CallModalProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  partner: UserProfile | null;
  currentUser: UserProfile;
  recipientId: string;
  pairCode: string;
  onEndCall: () => void;
  onLogMissedCall: (callType: 'audio' | 'video', isIncoming: boolean) => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  isIncoming,
  partner,
  currentUser,
  recipientId,
  pairCode,
  onEndCall,
  onLogMissedCall,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>(
    isIncoming ? 'ringing' : 'ringing'
  );
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);
  const hasConnectedRef = useRef<boolean>(false);

  const partnerAvatar = partner ? getAvatarDetails(partner.avatar) : null;

  useEffect(() => {
    if (callState === 'connected') {
      hasConnectedRef.current = true;
    }
  }, [callState]);

  useEffect(() => {
    if (!isOpen) {
      if (!hasConnectedRef.current) {
        onLogMissedCall(callType, isIncoming);
      }
      hasConnectedRef.current = false;
      webrtcService.cleanup();
      setDuration(0);
      setCallState('ringing');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let stopSound: (() => void) | null = null;
    if (callState === 'ringing') {
      if (isIncoming) {
        stopSound = soundService.playRingtone();
      } else {
        stopSound = soundService.playDialTone();
      }
    }

    const initCall = async () => {
      try {
        if (!isIncoming) {
          await callSignalingService.startCall(
            pairCode,
            currentUser.id,
            currentUser.nickname,
            recipientId,
            callType
          );
        }

        const stream = await webrtcService.startLocalStream(callType === 'video');
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = webrtcService.createPeerConnection(
          (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            if (callState !== 'connected') {
              if (stopSound) stopSound();
              setCallState('connected');
              startTimer();
            }
          },
          (candidate) => {
            // ICE candidate
          }
        );

        if (!isIncoming) {
          setTimeout(() => {
            if (stopSound) stopSound();
            setCallState('connected');
            startTimer();
          }, 2500);
        }
      } catch (err: any) {
        setErrorMsg('Microphone or camera permission denied.');
        console.error(err);
      }
    };

    initCall();

    return () => {
      if (stopSound) stopSound();
      webrtcService.cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, callState, isIncoming]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    await callSignalingService.updateCallStatus(pairCode, 'accepted');
    setCallState('connected');
    startTimer();
  };

  const handleHangup = async () => {
    await callSignalingService.endCall(pairCode);
    webrtcService.cleanup();
    setCallState('ended');
    onEndCall();
  };

  const handleToggleMic = () => {
    const next = !isMuted;
    setIsMuted(next);
    webrtcService.toggleMic(next);
  };

  const handleToggleCamera = () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    webrtcService.toggleCamera(next);
  };

  const handleSwitchCamera = () => {
    webrtcService.switchCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07030d]/95 backdrop-blur-2xl animate-fade-in p-4">
      <div className="w-full max-w-lg h-full max-h-[85vh] rounded-3xl bg-gradient-to-b from-[#1c0c2e] to-[#0c0514] border border-rose-500/30 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-serif text-sm font-bold text-rose-200">
              OnlyUs {callType === 'video' ? 'Video' : 'Voice'} Call
            </span>
          </div>
          <span className="font-mono text-xs text-rose-300/80">
            {callState === 'connected' ? formatDuration(duration) : isIncoming ? 'Incoming Ringing...' : 'Calling...'}
          </span>
        </div>

        {/* Call Content Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/60">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {callState !== 'connected' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07030d]/80 backdrop-blur-md gap-4">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl bg-gradient-to-tr ${partnerAvatar?.gradient || 'from-rose-500 to-purple-600'} shadow-[0_0_30px_rgba(244,63,94,0.4)] border border-white/20 animate-bounce`}>
                    {partnerAvatar?.icon || '💕'}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    {partner?.nickname || 'Partner'}
                  </h3>
                  <p className="text-xs text-rose-300 animate-pulse">
                    {isIncoming ? 'Incoming video call...' : 'Ringing sweetheart...'}
                  </p>
                </div>
              )}

              {/* Local PiP Video */}
              <div className="absolute bottom-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            /* Audio Call UI */
            <div className="flex flex-col items-center justify-center gap-6 p-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                <div className={`w-32 h-32 rounded-3xl flex items-center justify-center text-6xl bg-gradient-to-tr ${partnerAvatar?.gradient || 'from-rose-500 to-purple-600'} shadow-[0_0_40px_rgba(244,63,94,0.5)] border border-white/20 relative z-10`}>
                  {partnerAvatar?.icon || '💕'}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-3xl font-bold text-white mb-1">
                  {partner?.nickname || 'Partner'}
                </h2>
                <p className="text-sm text-rose-300/80 font-medium">
                  {callState === 'connected' ? formatDuration(duration) : isIncoming ? 'Incoming voice call...' : 'Ringing sweetheart...'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-6 bg-[#140a24]/95 border-t border-purple-900/40 flex items-center justify-center gap-4">
          {isIncoming && callState === 'ringing' ? (
            <>
              <button
                onClick={handleHangup}
                className="flex-1 py-3.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
              >
                <Phone className="w-4 h-4" /> Accept
              </button>
            </>
          ) : (
            <>
              {/* Mute Mic */}
              <button
                onClick={handleToggleMic}
                className={`p-4 rounded-2xl border transition-all ${
                  isMuted
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-white/5 hover:bg-white/10 text-rose-200 border-white/10'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Toggle Camera (if video call) */}
              {callType === 'video' && (
                <>
                  <button
                    onClick={handleToggleCamera}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCameraOff
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-white/5 hover:bg-white/10 text-rose-200 border-white/10'
                    }`}
                    title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                  >
                    {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleSwitchCamera}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-rose-200 border border-white/10 transition-all"
                    title="Switch camera"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* End Call */}
              <button
                onClick={handleHangup}
                className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-red-600/40 transition-all scale-105"
                title="End call"
              >
                <PhoneOff className="w-5 h-5" /> End Call
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
