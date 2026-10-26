import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

export interface CallSignalState {
  callId: string;
  callerId: string;
  callerNickname: string;
  recipientId: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  createdAt: number;
}

class CallSignalingService {
  private unsubCall: (() => void) | null = null;

  async startCall(
    pairCode: string,
    callerId: string,
    callerNickname: string,
    recipientId: string,
    type: 'audio' | 'video'
  ): Promise<string> {
    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const callState: CallSignalState = {
      callId,
      callerId,
      callerNickname,
      recipientId,
      type,
      status: 'ringing',
      createdAt: Date.now(),
    };
    try {
      const callDocRef = doc(db, 'couples', pairCode, 'active_call', 'state');
      await setDoc(callDocRef, callState);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `couples/${pairCode}/active_call/state`);
    }
    return callId;
  }

  async updateCallStatus(pairCode: string, status: 'ringing' | 'accepted' | 'declined' | 'ended') {
    try {
      const callDocRef = doc(db, 'couples', pairCode, 'active_call', 'state');
      await setDoc(callDocRef, { status }, { merge: true });
    } catch (e) {
      console.warn('Failed to update call status:', e);
    }
  }

  async endCall(pairCode: string) {
    try {
      const callDocRef = doc(db, 'couples', pairCode, 'active_call', 'state');
      await setDoc(callDocRef, { status: 'ended' }, { merge: true });
    } catch (e) {
      console.warn('Failed to end call:', e);
    }
  }

  listenToCalls(pairCode: string, currentUserId: string, onCallUpdate: (call: CallSignalState | null) => void) {
    if (this.unsubCall) {
      this.unsubCall();
      this.unsubCall = null;
    }

    try {
      const callDocRef = doc(db, 'couples', pairCode, 'active_call', 'state');
      this.unsubCall = onSnapshot(
        callDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as CallSignalState;
            onCallUpdate(data);
          } else {
            onCallUpdate(null);
          }
        },
        (error) => {
          console.warn('Call signaling listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to calls:', e);
    }
  }

  stopListening() {
    if (this.unsubCall) {
      this.unsubCall();
      this.unsubCall = null;
    }
  }
}

export const callSignalingService = new CallSignalingService();
