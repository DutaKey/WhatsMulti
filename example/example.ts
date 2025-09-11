import WhatsMulti from '../src';

// Main function to start WhatsMulti example
async function start() {
    const client = new WhatsMulti({
        mongoUri: 'mongodb://localhost:27017/whatsmulti-db',
        // startWhenSessionCreated: true,
    });

    // Create and start the first session
    await client.createSession('session-1', 'mongodb', { printQR: true });
    await client.startSession('session-1');

    // Load existing sessions
    // await client.loadSessions();

    // Session status event listeners
    client.on('close', (_, { sessionId }) => console.log(`${sessionId} is Disconnected.`));
    client.on('connecting', (_, { sessionId }) => console.log(`${sessionId} is Connecting...`));
    client.on('open', (_, { sessionId }) => console.log(`${sessionId} is Connected.`));

    // QR code event
    client.on('qr', (data) => console.log(data));

    // Incoming message handler
    client.on('messages.upsert', async (data, { sessionId }) => {
        try {
            const msg = data.messages[0];
            if (msg.key.fromMe) return;

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const [command, ...args] = text.split(' ');

            switch (command) {
                case 'status': {
                    const status = await client.getSession(sessionId).then((s) => s?.status);
                    client.message.sendText(sessionId, msg, `Session Status: ${status}`);
                    break;
                }

                case 'allsessions': {
                    const sessions = await client.getSessions();
                    client.sendMessage(sessionId, msg, {
                        text: `Total Sessions: ${sessions.length}\n${sessions.map((s) => s.id).join('\n')}`,
                    });
                    break;
                }

                case 'create': {
                    const newSessionId = args[0] || 'session-2';
                    client.createSession(newSessionId, 'local', { printQR: false });
                    break;
                }

                case 'start': {
                    const targetSessionId = args[0] || 'session-1';
                    await client.startSession(targetSessionId);

                    client.on('qr', (data, { sessionId: newSessionId }) => {
                        if (newSessionId === targetSessionId) {
                            const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
                            const buffer = Buffer.from(base64Data, 'base64');
                            client.message.send(targetSessionId, msg, {
                                image: buffer,
                                caption: 'Scan QR Code.',
                            });
                        }
                    });

                    client.on('open', (_, { sessionId: newSessionId }) => {
                        if (newSessionId === targetSessionId) {
                            client.sendMessage(targetSessionId, msg, {
                                text: `Session ${targetSessionId} is Connected.`,
                            });
                        }
                    });
                    break;
                }

                case 'delete': {
                    const targetSessionId = args[0] || 'session-1';
                    client.deleteSession(targetSessionId);
                    client.sendMessage(targetSessionId, msg, {
                        text: `Session ${targetSessionId} has been deleted.`,
                    });
                    break;
                }

                case 'send': {
                    const targetSessionId = args[0] || 'session-1';
                    const message = args.slice(1).join(' ');
                    client.sendMessage(targetSessionId, msg, { text: message });
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
}

// Start the example
start();
