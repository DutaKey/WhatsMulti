import fs from 'fs';
import path from 'path';
import { LOCAL_CONNECTION_PATH } from '../Defaults';
import { logger } from './logger';
import { connectToMongo, getAuthModel, isMongoDBConnected, mongoose } from './mongo-client';
import { ConfigType, ConnectionType } from '../Types';

export const validateSessionId = (id: string) => /^(?:[\w-]+)$/.test(id);

export const getAllExistingSessions = async (
    config: ConfigType
): Promise<{ id: string; connectionType: ConnectionType }[]> => {
    const mongoUri = config.mongoUri;
    const sessions: { id: string; connectionType: ConnectionType }[] = [];

    if (mongoUri) {
        const mongoIds = await getAllMongoSessions(mongoUri);
        sessions.push(...mongoIds.map((id) => ({ id, connectionType: 'mongodb' as ConnectionType })));
    }

    const localIds = await getAllLocalSessions(config);
    sessions.push(...localIds.map((id) => ({ id, connectionType: 'local' as ConnectionType })));

    const map = new Map<string, ConnectionType>();
    for (const s of sessions) {
        if (!map.has(s.id)) map.set(s.id, s.connectionType);
    }

    return Array.from(map.entries()).map(([id, connectionType]) => ({ id, connectionType }));
};

export const deleteSessionOnLocal = (sessionId: string, config: ConfigType) => {
    const localPath = path.resolve(config.localConnectionPath || LOCAL_CONNECTION_PATH);
    const sessionPath = path.join(localPath, sessionId);

    fs.rm(sessionPath, { recursive: true }, (err) => {
        if (err) return logger.error(err);
    });
};

export const deleteSessionOnMongo = async (sessionId: string, config: ConfigType) => {
    if (!isMongoDBConnected()) await connectToMongo(config.mongoUri);
    if (!mongoose.connection.db) return;
    const sessionCollection = mongoose.connection.db.collection(sessionId);
    await sessionCollection.drop();
};

const getAllLocalSessions = async (config: ConfigType) => {
    const localPath = config.localConnectionPath || LOCAL_CONNECTION_PATH;
    try {
        await fs.promises.mkdir(localPath, { recursive: true });
        const sessions = await fs.promises.readdir(localPath, { withFileTypes: true });
        return sessions
            .filter((session) => checkSessionExistOnLocal(session.name, localPath))
            .map((session) => session.name);
    } catch {
        return [];
    }
};

const getAllMongoSessions = async (mongoUri: string) => {
    if (!isMongoDBConnected()) await connectToMongo(mongoUri);
    if (!mongoose.connection.db) return [];
    try {
        const sessions = await mongoose.connection.db.listCollections().toArray();
        return sessions.filter((session) => checkSessionExistOnMongo(session.name)).map((session) => session.name);
    } catch {
        return [];
    }
};

const checkSessionExistOnLocal = (sessionId: string, localPath: string) => {
    const sessionPath = path.join(localPath, sessionId);
    const sessionPathCreds = path.join(sessionPath, 'meta.json');
    try {
        return fs.existsSync(sessionPath) && fs.lstatSync(sessionPath).isDirectory() && fs.existsSync(sessionPathCreds);
    } catch {
        return false;
    }
};

const checkSessionExistOnMongo = async (sessionId: string) => {
    const AuthModel = await getAuthModel(sessionId);
    const exists = await AuthModel.exists({ _id: 'meta' });
    return exists;
};
