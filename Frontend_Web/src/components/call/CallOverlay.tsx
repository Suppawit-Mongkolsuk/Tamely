import { useEffect, useMemo, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCContext } from '@/contexts/WebRTCContext';

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return [mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
}

function CallAvatar({
  name,
  avatarUrl,
  className = 'size-24',
  textClassName = 'text-3xl',
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} rounded-full object-cover shadow-lg`}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex ${className} items-center justify-center rounded-full bg-[#0B3C5D] font-semibold text-white shadow-lg ${textClassName}`}>
      {initials}
    </div>
  );
}

export function CallOverlay() {
  const {
    callState,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    minimizeCallUI,
    expandCallUI,
  } = useWebRTCContext();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = callState.localStream;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.localStream, callState.remoteStream, callState.status, callState.isMinimized]);

  const peerName = callState.peerName ?? 'Unknown user';
  const peerAvatarUrl = callState.peerAvatarUrl;
  const callLabel = useMemo(
    () => (callState.callType === 'video' ? 'Video call' : 'Voice call'),
    [callState.callType],
  );

  if (callState.status === 'idle' || callState.status === 'ended') return null;

  if (callState.isMinimized && (callState.status === 'calling' || callState.status === 'connected')) {
    return (
      <div className="fixed right-4 bottom-4 z-[80]">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        <div className="flex w-[320px] items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur">
          {callState.callType === 'video' ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-20 w-16 object-cover"
              />
            </div>
          ) : (
            <div className="shrink-0">
              <CallAvatar
                name={peerName}
                avatarUrl={peerAvatarUrl}
                className="size-12"
                textClassName="text-sm"
              />
            </div>
          )}
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={expandCallUI}
          >
            <p className="truncate text-sm font-semibold">{peerName}</p>
            <p className="text-xs text-white/70">
              {callState.status === 'calling' ? 'Calling...' : formatDuration(callState.callDuration)}
            </p>
          </button>
          {callState.status === 'connected' && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {callState.isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={expandCallUI}
          >
            <Maximize2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="size-10 rounded-full"
            onClick={endCall}
          >
            <PhoneOff className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (callState.status === 'ringing') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-6 flex justify-center">
            <CallAvatar name={peerName} avatarUrl={peerAvatarUrl} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">{peerName}</h2>
          <p className="mt-2 text-sm text-slate-500">Incoming {callLabel.toLowerCase()}</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              type="button"
              size="lg"
              className="rounded-full bg-emerald-600 px-6 hover:bg-emerald-700"
              onClick={() => void acceptCall()}
            >
              <Phone className="mr-2 size-4" />
              Accept
            </Button>
            <Button
              type="button"
              size="lg"
              variant="destructive"
              className="rounded-full px-6"
              onClick={rejectCall}
            >
              <PhoneOff className="mr-2 size-4" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (callState.status === 'calling') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_top,_#154e70,_#020617_70%)] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur">
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={minimizeCallUI}
            >
              <Minimize2 className="size-4" />
            </Button>
          </div>
          <div className="mb-6 flex justify-center">
            <CallAvatar name={peerName} avatarUrl={peerAvatarUrl} />
          </div>
          <h2 className="text-3xl font-semibold">{peerName}</h2>
          <p className="mt-3 text-sm text-white/75">Calling...</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/50">{callLabel}</p>
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              size="lg"
              variant="destructive"
              className="rounded-full px-6"
              onClick={endCall}
            >
              <PhoneOff className="mr-2 size-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {callState.callType === 'video' ? (
        <div className="relative flex h-full flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f766e,_transparent_35%),linear-gradient(180deg,_#0f172a,_#020617)]" />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {!callState.remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50">
              <CallAvatar name={peerName} avatarUrl={peerAvatarUrl} />
              <p className="text-lg font-medium">{peerName}</p>
              <p className="text-sm text-white/70">Connecting video...</p>
            </div>
          )}
          <div className="relative z-10 flex items-start justify-between p-6">
            <div>
              <p className="text-2xl font-semibold">{peerName}</p>
              <p className="mt-1 text-sm text-white/70">{formatDuration(callState.callDuration)}</p>
            </div>
            <div className="flex items-start gap-3">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={minimizeCallUI}
              >
                <Minimize2 className="size-4" />
              </Button>
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-32 w-24 object-cover sm:h-40 sm:w-28"
                />
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-auto flex items-center justify-center gap-3 px-4 pb-8">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-14 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {callState.isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-14 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleVideo}
            >
              {callState.isVideoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="size-16 rounded-full"
              onClick={endCall}
            >
              <PhoneOff className="size-6" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#1d4ed8,_transparent_35%),linear-gradient(180deg,_#111827,_#020617)] px-6 text-center">
          <div className="absolute top-6 right-6">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={minimizeCallUI}
            >
              <Minimize2 className="size-4" />
            </Button>
          </div>
          <div className="mb-6">
            <CallAvatar name={peerName} avatarUrl={peerAvatarUrl} />
          </div>
          <h2 className="text-3xl font-semibold">{peerName}</h2>
          <p className="mt-2 text-sm text-white/70">{formatDuration(callState.callDuration)}</p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-14 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {callState.isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="size-16 rounded-full"
              onClick={endCall}
            >
              <PhoneOff className="size-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
