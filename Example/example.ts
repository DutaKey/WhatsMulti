import WhatsMulti from '../src';

// Start the WhatsMulti example
const start = async () => {
    const client = new WhatsMulti({
        mongoUri: 'mongodb://localhost:27017/whatsmulti',
    });

    // Create the first session with local storage
    await client.createSession('session-1', 'mongodb');

    // Event listeners for session status changes
    client.on('disconnected', (_, sessionId) => console.log(sessionId, 'is Disconnected.'));
    client.on('connecting', (_, sessionId) => console.log(sessionId, 'is Connecting...'));
    client.on('connected', (_, sessionId) => console.log(sessionId, 'is Connected.'));

    // Listen for QR Code event and log it
    client.on('qr', (data) => console.log(data));

    // Listen for incoming messages
    client.on('messages.upsert', (data, sessionId) => {
        const msg = data.messages[0];
        if (msg.key.fromMe) return; // Ignore messages sent by the bot

        const text = msg.message?.conversation || '';
        const command = text.split(' ')[0]; // Extract command from message

        switch (command) {
            case 'status': {
                const status = client.getSessionStatus(sessionId);
                client.sendMessage(sessionId, msg, {
                    text: `Status: ${sessionId} is ${status}`,
                });
                break;
            }

            case 'allsessions': {
                // List all active sessions
                const sessions = client.getSessions();
                client.sendMessage(sessionId, msg, {
                    text: `Total Sessions: ${sessions.length}\n${sessions.join('\n')}`,
                });
                break;
            }

            case 'create': {
                // Create a new session dynamically
                const newSessionIdVar = text.split(' ')[1] || 'session-2';
                client.createSession(newSessionIdVar, 'local', {
                    printQRInTerminal: false,
                });

                // Send QR code when it's generated
                client.on('qr', (data, newSessionId) => {
                    if (newSessionId === newSessionIdVar) {
                        const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
                        const buffer = Buffer.from(base64Data, 'base64');
                        client.sendMessage(sessionId, msg, {
                            image: buffer,
                            caption: 'Scan QR Code.',
                        });
                    }
                });

                // Notify when the session is connected
                client.on('connected', (_, newSessionId) => {
                    if (newSessionId === newSessionIdVar) {
                        client.sendMessage(sessionId, msg, {
                            text: `Session ${newSessionIdVar} is Connected.`,
                        });
                    }
                });
                break;
            }

            case 'delete': {
                // Delete an existing session
                sessionId = text.split(' ')[1] || 'session-1';
                client.deleteSession(sessionId);
                client.sendMessage(sessionId, msg, {
                    text: `Session ${sessionId} has been deleted.`,
                });
                break;
            }

            case 'send': {
                // Send a message to a specific session
                sessionId = text.split(' ')[1] || 'session-1';
                const message = text.split(' ').slice(2).join(' ');
                client.sendMessage(sessionId, msg, {
                    text: message,
                });
                break;
            }
        }
    });
};

// Start the example
start();
