import { AnyMessageContent, MiscMessageGenerationOptions, WAMessage } from '@whiskeysockets/baileys';
import { logger } from '../Utils/logger';
import { getSession } from './sessions';

export const sendMessage = async (
    sessionId: string,
    recipient: string | WAMessage,
    message: AnyMessageContent,
    options?: MiscMessageGenerationOptions
) => {
    const session = getSession(sessionId);

    if (!session) return logger.error(`Session ${sessionId} does not exist`);

    let jid: string;

    if (typeof recipient === 'string') {
        jid = recipient.includes('@') ? recipient : `${recipient}@s.whatsapp.net`;
    } else if (recipient.key?.remoteJid) {
        jid = recipient.key.remoteJid;
    } else {
        return logger.error('Invalid recipient format');
    }

    await session.sock.sendMessage(jid, message, options);
};
