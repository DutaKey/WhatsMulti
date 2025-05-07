import pino from 'pino';
import { Configs } from '../Stores';

const logger = pino({
    level: Configs.getValue('LoggerLevel') || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            customColors: 'error:red,warn:yellow,info:blue,debug:green',
        },
    },
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
});

const baileysLogger = pino({
    level: 'silent',
});

export { logger, baileysLogger };
