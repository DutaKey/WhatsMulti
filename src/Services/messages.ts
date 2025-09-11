import { getJid } from '../Utils/messages';
import { MessageContentType, MessageOptionsType, MessageType } from '../Types';
import type { WhatsMulti } from './client';

export class MessageService {
    private client: WhatsMulti;

    constructor(client: WhatsMulti) {
        this.client = client;
    }

    async send(
        sessionId: string,
        recipient: string | MessageType,
        content: MessageContentType,
        options?: MessageOptionsType
    ) {
        const socket = this.client['getSocket'](sessionId);
        if (!socket) throw new Error('Session not running');
        const jid = getJid(recipient);
        return socket.sendMessage(jid, content, options);
    }

    async sendText(sessionId: string, recipient: string | MessageType, text: string, options?: MessageOptionsType) {
        return this.send(sessionId, recipient, { text }, options);
    }

    async sendQuote(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        quoted: MessageType,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { text }, { ...options, quoted });
    }

    async sendMention(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        mentions: string[],
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { text, mentions }, options);
    }

    async forwardMessage(
        sessionId: string,
        recipient: string | MessageType,
        message: MessageType,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { forward: message }, options);
    }

    async sendLocation(
        sessionId: string,
        recipient: string | MessageType,
        latitude: number,
        longitude: number,
        options?: MessageOptionsType
    ) {
        return this.send(
            sessionId,
            recipient,
            { location: { degreesLatitude: latitude, degreesLongitude: longitude } },
            options
        );
    }

    async sendContact(
        sessionId: string,
        recipient: string | MessageType,
        displayName: string,
        vcard: string,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { contacts: { displayName, contacts: [{ vcard }] } }, options);
    }

    async sendReaction(
        sessionId: string,
        recipient: string | MessageType,
        emoji: string,
        key: MessageType,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { react: { text: emoji, key } }, options);
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
        return this.send(
            sessionId,
            recipient,
            { poll: { name, values, selectableCount, toAnnouncementGroup } },
            options
        );
    }

    async sendLinkPreview(
        sessionId: string,
        recipient: string | MessageType,
        text: string,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { text }, options);
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
        return this.send(sessionId, recipient, { video: { url: video }, caption, gifPlayback, ptv }, options);
    }

    async sendAudio(
        sessionId: string,
        recipient: string | MessageType,
        audio: string,
        mimetype: string = 'audio/mp4',
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { audio: { url: audio }, mimetype }, options);
    }

    async sendImage(
        sessionId: string,
        recipient: string | MessageType,
        image: string,
        caption?: string,
        options?: MessageOptionsType
    ) {
        return this.send(sessionId, recipient, { image: { url: image }, caption }, options);
    }
}
