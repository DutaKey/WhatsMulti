import pino from 'pino';

export const createLogger = (loggerLevel: string = 'info') =>
    pino({
        level: loggerLevel,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                messageFormat: ' [WhatsMulti] {msg}',
                customColors: 'error:red,warn:yellow,info:blue,debug:green',
            },
        },
    });

export const createBaileysLogger = (baileysLoggerLevel: string = 'silent') =>
    pino({
        level: baileysLoggerLevel,
    });

export const logger = createLogger();
export const baileysLogger = createBaileysLogger();
