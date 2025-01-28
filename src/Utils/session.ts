import fs from 'fs';
import path from 'path';
import { LOCAL_CONNECTION_PATH } from '../Defaults';
import { getSession } from '../Services';
import { logger } from './logger';


export const isSessionRunning = (sessionId: string) => {
    return getSession(sessionId)?.status === "open";
}

export const isSessionExist = (sessionId: string) => {
    return checkSessionOnLocal(sessionId);
};

const checkSessionOnLocal = (sessionId: string) => {
    const sessionPath = path.join(LOCAL_CONNECTION_PATH, sessionId);
    return fs.existsSync(sessionPath) && fs.lstatSync(sessionPath).isDirectory();
};

export const deleteSessionOnLocal = (sessionId: string) => {
    const sessionPath = path.join(LOCAL_CONNECTION_PATH, sessionId);
    fs.rm(sessionPath, { recursive: true }, (err) => {
        if (err) {
            logger.error(err);
        }
    });
}
