import { LOCAL_CONNECTION_PATH } from './../Defaults/index';
import { AuthStateType } from '../Types/Connection';
import { useLocalAuthState } from './use-local-auth-state';
import { useMongoAuthState } from './use-mongo-auth-state';
import { connectToMongo, isMongoDBConnected } from './mongo-client';
import path from 'path';

export const authState = async ({ sessionId, connectionType }: AuthStateType): Promise<any> => {
    const sessionPath = path.resolve(LOCAL_CONNECTION_PATH, sessionId);

    if (connectionType === 'local') {
        return await useLocalAuthState(sessionPath);
    }

    if (connectionType === 'mongodb') {
        if (!isMongoDBConnected()) await connectToMongo();
        return await useMongoAuthState(sessionId);
    }
};
