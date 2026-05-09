import { useState, useRef, useEffect } from 'react';
import { sfx } from '../services/sfx';
import toast from 'react-hot-toast';

export function useWebRTC({ wsSend, loadCalls }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceBuffer = useRef([]);
  const offerBuffer = useRef(null);
  
  const activeCallRef = useRef(activeCall);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  const tryAttach = (videoRef, stream) => {
    let attempts = 0;
    const interval = setInterval(() => {
      if (videoRef.current && stream) {
        if (videoRef.current.srcObject !== stream) videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        clearInterval(interval);
      } else if (attempts > 50) clearInterval(interval);
      attempts++;
    }, 100);
  };

  const flushIceBuffer = async () => {
    while (iceBuffer.current.length > 0) {
      const cand = iceBuffer.current.shift();
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)); } catch(e){}
    }
  };

  async function setupWebRTC(targetId, isCaller) {
    try {
      if (pcRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (ev) => {
        remoteStreamRef.current = ev.streams[0] || new MediaStream([ev.track]);
        tryAttach(remoteVideoRef, remoteStreamRef.current);
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) wsSend({ type: "webrtc_ice", to_user_id: targetId, candidate: e.candidate });
      };
      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsSend({ type: "webrtc_offer", to_user_id: targetId, sdp: pc.localDescription });
      }
    } catch (err) { 
      toast.error("Nu am putut accesa camera sau microfonul.");
      endCall(); 
    }
  }

  function endCall() {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    iceBuffer.current = [];
    offerBuffer.current = null;
    setActiveCall(null);
    setIncomingCall(null);
    if (sfx.hangup) sfx.hangup();
    if (loadCalls) loadCalls();
  }

  const startCall = async (target) => {
    if(!target) return;
    setActiveCall({ ...target, status: 'calling' });
    wsSend({ type: "call_invite", to_user_id: target.user_id });
    if (sfx.send) sfx.send();
    await setupWebRTC(target.user_id, true);
    tryAttach(localVideoRef, localStreamRef.current);
  };

  const acceptCall = async () => {
    if (incomingCall) {
      const targetId = incomingCall.from_user_id;
      setActiveCall({ ...incomingCall, status: 'connected' });
      wsSend({ type: "call_accept", to_user_id: targetId });
      setIncomingCall(null);
      await setupWebRTC(targetId, false);
      tryAttach(localVideoRef, localStreamRef.current);
      if (offerBuffer.current && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offerBuffer.current.sdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          wsSend({ type: "webrtc_answer", to_user_id: targetId, sdp: answer });
          offerBuffer.current = null;
          await flushIceBuffer();
        } catch (e) {}
      }
    }
  };

  const processWebRTCMessage = async (msg) => {
    if (msg.type === 'call_invite') {
      if (pcRef.current || activeCallRef.current) return wsSend({ type: 'call_reject', to_user_id: msg.from_user_id });
      setIncomingCall(msg);
      if (sfx.call) sfx.call();
    }
    if (msg.type === "webrtc_offer") {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          wsSend({ type: "webrtc_answer", to_user_id: msg.from_user_id, sdp: answer });
          await flushIceBuffer();
        } catch (e) {}
      } else { offerBuffer.current = msg; }
    }
    if (msg.type === "webrtc_answer" && pcRef.current) {
      try { await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp)); await flushIceBuffer(); } catch (e) {}
    }
    if (msg.type === "webrtc_ice") {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch(e){}
      } else { iceBuffer.current.push(msg.candidate); }
    }
    if (msg.type === "call_accept") setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    if (msg.type === "call_reject" || msg.type === "call_hangup") endCall();
  };

  return {
    incomingCall, activeCall, localVideoRef, remoteVideoRef, isMicOn, isCamOn,
    startCall, acceptCall, rejectCall: () => { if (incomingCall) wsSend({ type: "call_reject", to_user_id: incomingCall.from_user_id }); endCall(); },
    handleHangup: () => { const tid = activeCall?.user_id || activeCall?.from_user_id; if (tid) wsSend({ type: "call_hangup", to_user_id: tid }); endCall(); },
    toggleMic: () => { if (localStreamRef.current) { const t = localStreamRef.current.getAudioTracks()[0]; if(t){ t.enabled = !t.enabled; setIsMicOn(t.enabled); }}},
    toggleCamera: () => { if (localStreamRef.current) { const t = localStreamRef.current.getVideoTracks()[0]; if(t){ t.enabled = !t.enabled; setIsCamOn(t.enabled); }}},
    processWebRTCMessage
  };
}