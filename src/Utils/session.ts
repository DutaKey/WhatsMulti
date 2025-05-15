import fs from 'fs';
import path from 'path';
import { LOCAL_CONNECTION_PATH } from '../Defaults';
import { getSession } from '../Services/sessions';
import { logger } from './logger';
import { connectToMongo, isMongoDBConnected, mongoose } from './mongo-client';
import { Configs, sessions } from '../Stores';
import { SessionStatusType } from '../Types/Session';

export const isSessionRunning = (sessionId: string) => {
    return getSession(sessionId)?.status === 'open';
};

export const isSessionExist = async (sessionId: string) => {
    return checkSessionOnLocal(sessionId) || (await checkSessionOnMongo(sessionId));
};

const checkSessionOnLocal = (sessionId: string) => {
    const sessionPath = path.join(LOCAL_CONNECTION_PATH, sessionId);
    return fs.existsSync(sessionPath) && fs.lstatSync(sessionPath).isDirectory();
};

const checkSessionOnMongo = async (sessionId: string) => {
    if (!isMongoDBConnected()) await connectToMongo();
    if (!mongoose.connection.db) return false;
    const sessionCollection = mongoose.connection.db.collection(sessionId);
    const sessionExists = await sessionCollection.findOne({}).then((res) => !!res);
    return sessionExists;
};

export const updateSessionStatus = (sessionId: string, status: SessionStatusType): void => {
    const session = sessions.get(sessionId);
    if (session) {
        session.status = status;
    }
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
