import makeWASocket, { BaileysEventMap, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { CreateSessionType } from "../Types/Session";
import { authState, deleteSessionOnLocal, isSessionExist, isSessionRunning } from "../Utils";
import { baileysLogger, logger } from "../Utils/logger";
import { sessions } from "../Stores";
import { handleSocketEvents } from "../Handlers/socket";
import { EventMap } from "../Types/Event";

export const createSession = async ({ sessionId, connectionType, options }: CreateSessionType) => {
    try {
        if(isSessionExist(sessionId) && isSessionRunning(sessionId)) return logger.warn(`Session ${sessionId} is already running`);
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await authState({ sessionId, connectionType });
        baileysLogger.level = options?.baileysLoggerLevel || "silent";

        const sock = makeWASocket({
            version,
            ...options,
            auth: state,
            printQRInTerminal: true,
            logger: baileysLogger,
          });

        sessions.set(sessionId, { sock, status: "connecting", connectionType, options });

        sock.ev.process(async (events: EventMap) => {
            handleSocketEvents({ sessionId, eventMap: events, sock, saveCreds });
        })
    } catch (e) {
        logger.error(e);
    }
};

export const getSession = (sessionId: string) => sessions.get(sessionId);

export const getAllSessions = () => Array.from(sessions.keys());

export const getSessionStatus = (sessionId: string) => getSession(sessionId)?.status;

export const deleteSession = async (sessionId: string) => {
    try {
        const session = getSession(sessionId);
        if(isSessionRunning(sessionId)) {
            await session?.sock.logout().catch(() => {});
        };
        if(!isSessionExist(sessionId)) return logger.error(`Session ${sessionId} does not exist`);

        switch (session?.connectionType) {
            case "local":
                deleteSessionOnLocal(sessionId);
                break;
        }
        sessions.delete(sessionId);
    } catch (error) {
        logger.error(error);
    }
};
