import { DEFAULT_SOCKET_CONFIG } from './../Defaults/index';
import { SockConfig } from '../Types/Session';

export const getSocketConfig = (config: Partial<SockConfig>, sessionId: string) => {
    return {
        ...DEFAULT_SOCKET_CONFIG(sessionId),
        ...config,
    };
};
