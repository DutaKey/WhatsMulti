import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import makeWASocket, {
    ConnectionState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    WASocket,
} from '@whiskeysockets/baileys';
import { authState, deleteSessionOnLocal, deleteSessionOnMongo, createBaileysLogger, createLogger } from '../Utils';
import { AuthStateType, ConfigType, ConnectionType } from '../Types/Connection';
import { SessionStatusType, SockConfig } from '../Types/Session';
import { getSocketConfig } from '../Utils/socket';
import { EventMap, EventMapKey, MetaEventCallbackType } from '../Types';

export class Session {
    readonly id: string;
    readonly connectionType: ConnectionType;
    status: SessionStatusType = 'close';
    qr?: EventMap['qr'];
    socket?: WASocket;
    lastDisconnectTime?: string;
    sessionStartTime?: string;

    private auth!: AuthStateType;
    private socketConfig: Partial<SockConfig>;
    private logger: ReturnType<typeof createLogger>;
    private baileysLogger: ReturnType<typeof createBaileysLogger>;
    private forceStop = false;
    private config: ConfigType;
    private eventCallbacks: <K extends EventMapKey>(event: K, data: EventMap[K], meta: MetaEventCallbackType) => void =
        () => {};

    constructor(
        id: string,
        connectionType: ConnectionType,
        sockConfig: Partial<SockConfig> = {},
        config: ConfigType,
        eventCallbacks: <K extends EventMapKey>(
            event: K,
            data: EventMap[K],
            meta: MetaEventCallbackType
        ) => void = () => {}
    ) {
        this.id = id;
        this.connectionType = connectionType;
        this.socketConfig = getSocketConfig(sockConfig, id);
        this.config = config;
        this.logger = createLogger(config.LoggerLevel || 'info');
        this.baileysLogger = createBaileysLogger(config.BaileysLoggerLevel || 'silent');
        this.eventCallbacks = eventCallbacks;
    }

    async init() {
        this.auth = await authState({ sessionId: this.id, connectionType: this.connectionType }, this.config);

        const meta = await this.auth.getMeta();
        if (meta) this.socketConfig = getSocketConfig(meta, this.id);
        await this.auth.setMeta(this.socketConfig);
    }

    private nowISO() {
        return new Date().toISOString();
    }

    private emit<K extends EventMapKey>(event: K, data: EventMap[K]) {
        this.eventCallbacks(event, data, { sessionId: this.id, socket: this.socket });
    }

    private async handleQr(qr: string) {
        const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
        const qrImage = await QRCode.toDataURL(qr, { type: 'image/png', errorCorrectionLevel: 'H' });

        if (this.socketConfig.printQR) {
            this.logger.info(`QR Code for session ${this.id}:\n${qrString}`);
        }

        this.qr = { image: qrImage, qr };
        this.emit('qr', this.qr);
    }

    private bindSocketEvents() {
        if (!this.socket) return;

        this.socket.ev.process(async (events: EventMap) => {
            for (const [evKey, evData] of Object.entries(events)) {
                if (evKey === 'creds.update') {
                    await this.auth.saveCreds();
                    continue;
                }

                if (evKey === 'connection.update') {
                    const update = evData as Partial<ConnectionState>;

                    if (update.qr) await this.handleQr(update.qr);
                    if (!update.connection) continue;

                    this.emit(update.connection, update);

                    if (update.connection === 'open') {
                        this.status = 'open';
                        this.qr = undefined;
                        this.sessionStartTime = this.nowISO();
                    }

                    if (update.connection === 'close') {
                        this.status = 'close';
                        this.qr = undefined;
                        this.lastDisconnectTime = this.nowISO();

                        const code = (update.lastDisconnect?.error as Boom | undefined)?.output;
                        const shouldReconnect = code?.statusCode !== DisconnectReason.loggedOut;

                        if (!this.forceStop && shouldReconnect) {
                            await this.start().catch((err) => this.logger.error({ err }, 'Failed to restart'));
                        }
                    }
                    continue;
                }

                this.emit(evKey as EventMapKey, evData);
            }
        });
    }

    async start() {
        if (this.status === 'open' || this.status === 'connecting') return;
        this.forceStop = false;

        if (!this.auth) await this.init();

        const { version } = await fetchLatestBaileysVersion();
        this.status = 'connecting';
        this.sessionStartTime = this.nowISO();

        this.socket = makeWASocket({
            auth: this.auth.state,
            version,
            logger: this.baileysLogger,
            ...this.socketConfig,
        });

        this.bindSocketEvents();
    }

    async stop() {
        if (!this.socket) return;
        this.forceStop = true;
        this.socket.end(new Error('Manual stop'));
        this.socket = undefined;
        this.status = 'close';
        this.lastDisconnectTime = this.nowISO();
    }

    async restart() {
        await this.stop();
        await this.start();
    }

    async logout() {
        if (!this.socket) return;
        await this.socket.logout();

        if (this.connectionType === 'local') {
            deleteSessionOnLocal(this.id, this.config);
        } else {
            await deleteSessionOnMongo(this.id, this.config);
        }

        this.qr = undefined;
        this.status = 'close';
        this.lastDisconnectTime = this.nowISO();
    }
}
