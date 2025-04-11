import { useMultiFileAuthState } from '@whiskeysockets/baileys';

export const useLocalAuthState = (sessionId: string) => useMultiFileAuthState(sessionId);
