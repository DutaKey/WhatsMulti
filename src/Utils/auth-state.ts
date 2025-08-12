import { LOCAL_CONNECTION_PATH } from './../Defaults/index';
import { AuthStateParamsType, AuthStateType, ConfigType } from '../Types/Connection';
import { useLocalAuthState } from './use-local-auth-state';
import { useMongoAuthState } from './use-mongo-auth-state';
import { connectToMongo, isMongoDBConnected } from './mongo-client';
import path from 'path';
import { useMemoryAuthState } from './use-memory-auth-state';

export const authState = async ({ sessionId, connectionType }: AuthStateParamsType, config: ConfigType): Promise<AuthStateType> => {
    const localPath = config.localConnectionPath || LOCAL_CONNECTION_PATH;
    const sessionDir = path.resolve(localPath, sessionId);

    switch (connectionType) {
        case 'local':
            return useLocalAuthState(sessionDir);

        case 'memory':
            return useMemoryAuthState(sessionId);

        case 'mongodb':
            if (!isMongoDBConnected()) {
                await connectToMongo(config.mongoUri);
            }
            return useMongoAuthState(sessionId);
    }
};
