import { getJid } from '../Utils/messages';
import { MessageOptionsType } from '../Types';
import { MessageType } from '../Types';
import { SocketType } from '../Types/Socket';

export class MessageService {
    async sendText(socket: SocketType, recipient: string | MessageType, text: string, options?: MessageOptionsType) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { text }, options);
    }

    async sendQuote(
        socket: SocketType,
        recipient: string | MessageType,
        text: string,
        quoted: MessageType,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { text }, { ...options, quoted });
    }

    async sendMention(
        socket: SocketType,
        recipient: string | MessageType,
        text: string,
        mentions: string[],
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { text, mentions }, options);
    }

    async forwardMessage(
        socket: SocketType,
        recipient: string | MessageType,
        message: MessageType,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { forward: message }, options);
    }

    async sendLocation(
        socket: SocketType,
        recipient: string | MessageType,
        latitude: number,
        longitude: number,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(
            jid,
            { location: { degreesLatitude: latitude, degreesLongitude: longitude } },
            options
        );
    }

    async sendContact(
        socket: SocketType,
        recipient: string | MessageType,
        displayName: string,
        vcard: string,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { contacts: { displayName, contacts: [{ vcard }] } }, options);
    }

    async sendReaction(
        socket: SocketType,
        recipient: string | MessageType,
        emoji: string,
        key: MessageType,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { react: { text: emoji, key } }, options);
    }

    async sendPoll(
        socket: SocketType,
        recipient: string | MessageType,
        name: string,
        values: string[],
        selectableCount: number = 1,
        toAnnouncementGroup: boolean = false,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { poll: { name, values, selectableCount, toAnnouncementGroup } }, options);
    }

    async sendLinkPreview(
        socket: SocketType,
        recipient: string | MessageType,
        text: string,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { text }, options);
    }

    async sendVideo(
        socket: SocketType,
        recipient: string | MessageType,
        video: string,
        caption?: string,
        gifPlayback?: boolean,
        ptv?: boolean,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { video: { url: video }, caption, gifPlayback, ptv }, options);
    }

    async sendAudio(
        socket: SocketType,
        recipient: string | MessageType,
        audio: string,
        mimetype: string = 'audio/mp4',
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { audio: { url: audio }, mimetype }, options);
    }

    async sendImage(
        socket: SocketType,
        recipient: string | MessageType,
        image: string,
        caption?: string,
        options?: MessageOptionsType
    ) {
        const jid = getJid(recipient);
        return socket.sendMessage(jid, { image: { url: image }, caption }, options);
    }
}
