import { AuthenticationState } from '@whiskeysockets/baileys';
import { LOCAL_CONNECTION_PATH } from './../Defaults/index';
import { AuthStateType } from '../Types/Connection';
import { useLocalAuthState } from './use-local-auth-state';
import { useMongoAuthState } from './use-mongo-auth-state';
import { connectToMongo, isMongoDBConnected } from './mongo-client';
import path from 'path';
import { MetaSessionStoreType } from '../Types';
import { UpdateWriteOpResult } from 'mongoose';

export const authState = async ({
    sessionId,
    connectionType,
}: AuthStateType): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
    setMeta: (value: MetaSessionStoreType) => Promise<void | UpdateWriteOpResult>;
    getMeta: () => Promise<MetaSessionStoreType | null>;
}> => {
    const sessionDir = path.resolve(LOCAL_CONNECTION_PATH, sessionId);

    switch (connectionType) {
        case 'local':
            return useLocalAuthState(sessionDir);

        case 'mongodb':
            if (!isMongoDBConnected()) {
                await connectToMongo();
            }
            return useMongoAuthState(sessionId);
    }
};
