import fs from 'fs';
import path from 'path';
import { LOCAL_CONNECTION_PATH } from '../Defaults';
import { getSession } from '../Services/sessions';
import { logger } from './logger';
import { connectToMongo, isMongoDBConnected, mongoose } from './mongo-client';
import { Configs } from '../Stores';

export const isSessionRunning = (sessionId: string) => {
    return getSession(sessionId)?.status === 'open';
};

export const isSessionExist = (sessionId: string) => {
    return checkSessionOnLocal(sessionId);
};

const checkSessionOnLocal = (sessionId: string) => {
    const sessionPath = path.join(LOCAL_CONNECTION_PATH, sessionId);
    return fs.existsSync(sessionPath) && fs.lstatSync(sessionPath).isDirectory();
};

export const deleteSessionOnLocal = (sessionId: string) => {
    const localPath = Configs.getValue('localConnectionPath') || LOCAL_CONNECTION_PATH;
    const sessionPath = path.join(localPath, sessionId);
    fs.rm(sessionPath, { recursive: true }, (err) => {
        if (err) return logger.error(err);
    });
};

export const deleteSessionOnMongo = async (sessionId: string) => {
    if (!isMongoDBConnected()) await connectToMongo();
    if (!mongoose.connection.db) return;

    const sessionCollection = mongoose.connection.db.collection(sessionId);

    await sessionCollection.drop();
};
