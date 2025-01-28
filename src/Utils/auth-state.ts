import { LOCAL_CONNECTION_PATH } from './../Defaults/index';
import { AuthStateType } from "../Types/Connection";
import { useLocalAuthState } from "./use-local-auth-state";
import path from "path";

export const authState = async ({sessionId, connectionType}: AuthStateType): Promise<any> => {
    switch (connectionType) {
        case 'local':
            const { state, saveCreds } = await useLocalAuthState(path.resolve(LOCAL_CONNECTION_PATH, sessionId));
            return { state, saveCreds };
        break;

        default:
            break;
    }
};
