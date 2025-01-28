import pino from "pino";

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

const baileysLogger = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` });

export { logger, baileysLogger };
