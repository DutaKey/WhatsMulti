import { AnyMessageContent, MiscMessageGenerationOptions } from "@whiskeysockets/baileys";
import { logger } from "../Utils/logger";
import { getSession } from "./sessions";

export const sendMessage = async (sessionId: string, id: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions ) => {
    const session = getSession(sessionId);
    if (!session) return logger.error(`Session ${sessionId} does not exist`);
    await session.sock.sendMessage(id, content, options);
};
