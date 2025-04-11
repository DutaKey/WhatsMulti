import pino from 'pino';
import { LoggerLevel } from '../Types/Session';

const logger = pino({
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

const baileysLogger = (level: LoggerLevel = 'silent') =>
    pino({ level, timestamp: () => `,"time":"${new Date().toJSON()}"` });

export { logger, baileysLogger };
