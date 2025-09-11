# @Dutakey/WhatsMulti

![NPM Downloads](https://img.shields.io/npm/dw/%40dutakey%2Fwhatsmulti?label=npm&color=%23CB3837)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/dutakey/whatsmulti)

## 📌 Overview

@Dutakey/WhatsMulti is a powerful wrapper for [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys), designed to efficiently manage multiple WhatsApp Web sessions. It offers advanced session handling, flexible event listeners, and various storage options, making it ideal for developers integrating WhatsApp into their applications.

## 🚀 Installation

Install via npm:

```sh
npm install @dutakey/whatsmulti
```

Or using yarn:

```sh
yarn add @dutakey/whatsmulti
```

## ✨ Key Features

-   **Seamless Multi-Session Management**: Effortlessly create, manage, and maintain multiple WhatsApp sessions.
-   **Flexible Storage Options**: Store sessions locally, in memory, or integrate with databases like MongoDB.
-   **Robust Event Handling**: Easily handle events across multiple sessions for real-time monitoring.
-   **QR Code Generation**: Automatically generate QR codes for session authentication.
-   **Message Sending**: Send various types of messages (text, images, etc.) across sessions.
-   **Session Lifecycle Management**: Start, stop, restart, and delete sessions programmatically.

## 📋 Table of Contents

-   [Quick Start](#-quick-start)
-   [Configuration](#-configuration)
-   [Session Management](#-session-management)
-   [Event Handling](#-event-handling)
-   [Message Operations](#-message-operations)
-   [Storage Options](#-storage-options)
-   [Contributing](#-contributing)
-   [License](#-license)

## 🚀 Quick Start

```typescript
import WhatsMulti from '@dutakey/whatsmulti';

const client = new WhatsMulti({
    mongoUri: 'mongodb://localhost:27017/whatsmulti-db', // Optional
    defaultConnectionType: 'local', // 'local' | 'mongodb' | 'memory'
});

// Create and start a session
await client.createSession('my-session', 'local', {
    printQR: true, // Print QR code to console
});

await client.startSession('my-session');

// Listen for events
client.on('open', (_, { sessionId }) => {
    console.log(`Session ${sessionId} is connected!`);
});

client.on('messages.upsert', async (data, { sessionId }) => {
    const message = data.messages[0];
    console.log('New message:', message);
});
```

## ⚙️ Configuration

### Constructor Options

```typescript
interface ConfigType {
    defaultConnectionType?: 'local' | 'mongodb' | 'memory';
    localConnectionPath?: string;
    LoggerLevel?: 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    BaileysLoggerLevel?: 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    mongoUri?: string;
    startWhenSessionCreated?: boolean;
}
```

### Socket Configuration

```typescript
interface SockConfig {
    disableQRRetry?: boolean;
    qrMaxWaitMs?: number;
    printQR?: boolean;
    // ... other Baileys SocketConfig options
}
```

## 🔧 Session Management

### Creating Sessions

Sessions can be created with different storage types:

```typescript
// Local storage (files)
await client.createSession('session-1', 'local');

// MongoDB storage
await client.createSession('session-2', 'mongodb');

// Memory storage (temporary)
await client.createSession('session-3', 'memory');
```

### Session Lifecycle

```typescript
// Create and start
await client.createSession('my-session', 'local', {
    printQR: true,
    qrMaxWaitMs: 60000,
});
await client.startSession('my-session');

// Stop temporarily
await client.stopSession('my-session');

// Restart
await client.restartSession('my-session');

// Logout and clean up
await client.logoutSession('my-session');

// Completely remove
await client.deleteSession('my-session');
```

### Loading Existing Sessions

```typescript
// Load all previously created sessions
await client.loadSessions();
```

## 📡 Event Handling

WhatsMulti extends EventEmitter and provides all Baileys events plus custom events:

### Built-in Events

```typescript
// Connection events
client.on('open', (data, { sessionId, socket }) => {
    console.log(`Session ${sessionId} connected`);
});

client.on('close', (data, { sessionId }) => {
    console.log(`Session ${sessionId} disconnected`);
});

client.on('connecting', (data, { sessionId }) => {
    console.log(`Session ${sessionId} is connecting...`);
});

// QR Code event
client.on('qr', (data, { sessionId }) => {
    console.log(`QR Code for ${sessionId}:`, data.qr);
    // data.image contains base64 image data
});

// Message events
client.on('messages.upsert', (data, { sessionId, socket }) => {
    data.messages.forEach((message) => {
        console.log(`New message in ${sessionId}:`, message);
    });
});

// Contact events
client.on('contacts.update', (contacts, { sessionId }) => {
    console.log(`Contacts updated in ${sessionId}:`, contacts);
});

// Group events
client.on('groups.update', (groups, { sessionId }) => {
    console.log(`Groups updated in ${sessionId}:`, groups);
});
```

### Event Processing

You can also use the `process` method to handle all events in one place:

```typescript
client.process((events, { sessionId, socket }) => {
    if (events['messages.upsert']) {
        // Handle messages
    }
    if (events.qr) {
        // Handle QR code
    }
    // Handle other events...
});
```

## 💬 Message Operations

Selain `sendMessage`, WhatsMulti menyediakan helper method yang lebih sederhana untuk mengirim berbagai tipe pesan melalui `client.message`.

### Generic Send

```typescript
await client.sendMessage('session-1', '1234567890@s.whatsapp.net', { text: 'Hello World!' });
```

### MessageService Helper Methods

WhatsMulti expose `client.message` untuk mempermudah pengiriman pesan.

#### Send Text

```typescript
await client.message.sendText('session-1', '1234567890@s.whatsapp.net', 'Hello World!');
```

#### Send Text with Quote

```typescript
await client.message.sendQuote('session-1', msg, 'This is a reply', msg);
```

#### Send Text with Mention

```typescript
await client.message.sendMention('session-1', '1234567890@s.whatsapp.net', 'Hello @user', [
    '1234567890@s.whatsapp.net',
]);
```

#### Forward Message

```typescript
await client.message.forwardMessage('session-1', '1234567890@s.whatsapp.net', msg);
```

#### Send Location

```typescript
await client.message.sendLocation('session-1', '1234567890@s.whatsapp.net', -6.2, 106.816666);
```

#### Send Contact

```typescript
const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
END:VCARD`;

await client.message.sendContact('session-1', '1234567890@s.whatsapp.net', 'John Doe', vcard);
```

#### Send Reaction

```typescript
await client.message.sendReaction('session-1', msg.key.remoteJid!, '👍', msg);
```

#### Send Poll

```typescript
await client.message.sendPoll('session-1', '1234567890@s.whatsapp.net', 'Favorite Fruit?', ['Apple', 'Banana'], 1);
```

#### Send Link Preview

```typescript
await client.message.sendLinkPreview('session-1', '1234567890@s.whatsapp.net', 'Check this out: https://example.com');
```

#### Send Image

```typescript
await client.message.sendImage(
    'session-1',
    '1234567890@s.whatsapp.net',
    'https://example.com/image.jpg',
    'Nice image!'
);
```

#### Send Video

```typescript
await client.message.sendVideo(
    'session-1',
    '1234567890@s.whatsapp.net',
    'https://example.com/video.mp4',
    'Watch this!',
    true
);
```

#### Send Audio

```typescript
await client.message.sendAudio('session-1', '1234567890@s.whatsapp.net', 'https://example.com/audio.mp3', 'audio/mp3');
```

## 💾 Storage Options

### Local Storage

Sessions are stored as files in the local filesystem:

```typescript
const client = new WhatsMulti({
    localConnectionPath: './sessions', // Default: './whatsmulti_sessions'
});

await client.createSession('my-session', 'local');
```

### MongoDB Storage

Sessions are stored in a MongoDB database:

```typescript
const client = new WhatsMulti({
    mongoUri: 'mongodb://localhost:27017/whatsmulti-db',
});

await client.createSession('my-session', 'mongodb');
```

### Memory Storage

Sessions are stored in memory (lost on restart):

```typescript
await client.createSession('my-session', 'memory');
```

## 🎯 Contributing

Contributions are welcome! If you find a bug, have feature suggestions, or want to improve the project, feel free to open an issue or submit a pull request.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run linting: `npm run lint`
5. Run the example: `npm run example`

## 📄 License

This project is licensed under **MIT**, allowing free use, modification, and distribution.
