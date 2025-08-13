import { sessions } from '../Stores';
import { ConfigType, ConnectionType, SessionInstance, SockConfig } from '../Types';
import { getAllExistingSessions, createLogger, validateSessionId } from '../Utils';
import { Session } from './sessions';
import { WMEventEmitter } from './event';
import { MessageOptionsType, MessageType } from '../Types/Messages';
import { MessageService } from './messages';

export class WhatsMulti extends WMEventEmitter {
    private sessions = sessions;
    private readonly messageService;
    private logger;
    config: ConfigType;

    constructor(config: ConfigType = {}) {
        super();
        this.config = config;
        this.logger = createLogger(config.LoggerLevel || 'info');
        this.messageService = new MessageService();
    }

    private getSocket(sessionId: string) {
        const s = this.sessions.get(sessionId);
        if (!s) throw new Error('Session not found');
        return s.socket;
    }

    async createSession(
        id: string,
        connectionType: ConnectionType = 'local',
        socketConfig?: Partial<SockConfig>
    ): Promise<void> {
        if (!validateSessionId(id)) throw new Error('Invalid session id');
        if (this.sessions.has(id)) throw new Error('Session exists');
        const session = new Session(
            id,
            connectionType,
            socketConfig,
            this.config,
            (event, data, { sessionId, socket }) => {
                this.emit(event, data, {
                    sessionId,
                    socket,
                });
            }
        );
        await session.init();
        this.sessions.set(id, session);
    }

    async startSession(id: string): Promise<void> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        await s.start();
    }

    async stopSession(id: string): Promise<void> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        await s.stop();
    }

    async deleteSession(id: string): Promise<void> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        await s.logout();
        this.sessions.delete(id);
    }

    async restartSession(id: string): Promise<void> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        await s.restart();
    }

    async logoutSession(id: string): Promise<void> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        await s.logout();
    }

    async getSession(id: string): Promise<SessionInstance | undefined> {
        const s = this.sessions.get(id);
        if (!s) return undefined;
        return {
            id: s.id,
            connectionType: s.connectionType,
            status: s.status,
            sessionStartTime: s.sessionStartTime,
            lastDisconnectTime: s.lastDisconnectTime,
            qr: s.qr,
        };
    }

    async getSessions(): Promise<SessionInstance[]> {
        return Array.from(this.sessions.values()).map((s) => ({
            id: s.id,
            connectionType: s.connectionType,
            sessionStartTime: s.sessionStartTime,
            lastDisconnectTime: s.lastDisconnectTime,
            status: s.status,
        }));
    }

    async getQr(id: string): Promise<{ image: string; qr: string } | undefined> {
        const s = this.sessions.get(id);
        if (!s) throw new Error('Session not found');
        return s.qr;
    }

    async loadSessions(): Promise<void> {
        const sessionIds = await getAllExistingSessions(this.config);

        const tasks = sessionIds.map(({ id, connectionType }) =>
            this.createSession(id, connectionType).catch((err) => {
                this.logger.error(`Failed to create session ${id}:`, err);
            })
        );

        await Promise.all(tasks);
    }
    async sendText(sessionId: string, recipient: string | MessageType, text: string, options?: MessageOptionsType) {
        return this.messageService.sendText(this.getSocket(sessionId), recipient, text, options);
    }

    async sendQuote(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        quoted: MessageType,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendQuote(this.getSocket(sessionId), recipient, text, quoted, options);
    }

    async sendMention(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        mentions: string[],
        options?: MessageOptionsType
    ) {
        return this.messageService.sendMention(this.getSocket(sessionId), recipient, text, mentions, options);
    }

    async forwardMessage(
        sessionId: string,
        recipient: string | MessageType,
        message: MessageType,
        options?: MessageOptionsType
    ) {
        return this.messageService.forwardMessage(this.getSocket(sessionId), recipient, message, options);
    }

    async sendLocation(
        sessionId: string,
        recipient: string | MessageType,
        latitude: number,
        longitude: number,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendLocation(this.getSocket(sessionId), recipient, latitude, longitude, options);
    }

    async sendContact(
        sessionId: string,
        recipient: string | MessageType,
        displayName: string,
        vcard: string,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendContact(this.getSocket(sessionId), recipient, displayName, vcard, options);
    }

    async sendReaction(
        sessionId: string,
        recipient: string | MessageType,
        emoji: string,
        key: MessageType,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendReaction(this.getSocket(sessionId), recipient, emoji, key, options);
    }

    async sendPoll(
        sessionId: string,
        recipient: string | MessageType,
        name: string,
        values: string[],
        selectableCount: number = 1,
        toAnnouncementGroup: boolean = false,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendPoll(
            this.getSocket(sessionId),
            recipient,
            name,
            values,
            selectableCount,
            toAnnouncementGroup,
            options
        );
    }

    async sendLinkPreview(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendLinkPreview(this.getSocket(sessionId), recipient, text, options);
    }

    async sendVideo(
        sessionId: string,
        recipient: string | MessageType,
        video: string,
        caption?: string,
        gifPlayback?: boolean,
        ptv?: boolean,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendVideo(
            this.getSocket(sessionId),
            recipient,
            video,
            caption,
            gifPlayback,
            ptv,
            options
        );
    }

    async sendAudio(
        sessionId: string,
        recipient: string | MessageType,
        audio: string,
        mimetype: string = 'audio/mp4',
        options?: MessageOptionsType
    ) {
        return this.messageService.sendAudio(this.getSocket(sessionId), recipient, audio, mimetype, options);
    }

    async sendImage(
        sessionId: string,
        recipient: string | MessageType,
        image: string,
        caption?: string,
        options?: MessageOptionsType
    ) {
        return this.messageService.sendImage(this.getSocket(sessionId), recipient, image, caption, options);
    }
}
