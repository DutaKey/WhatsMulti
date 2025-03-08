import WhatsMulti from "../src";

// Start the WhatsMulti example
const start = async () => {
    // Create the first session with local storage
    WhatsMulti.createSession({ sessionId: "session-1", connectionType: "local" });

    // Event listeners for session status changes
    WhatsMulti.on('disconnected', (_, sessionId) => console.log(sessionId, "is Disconnected."));
    WhatsMulti.on("connecting", (_, sessionId) => console.log(sessionId, "is Connecting..."));
    WhatsMulti.on("connected", (_, sessionId) => console.log(sessionId, "is Connected."));

    // Listen for QR Code event and log it
    WhatsMulti.on("qr", (qr) => console.log(qr));

    // Listen for incoming messages
    WhatsMulti.on("messages.upsert", (data, sessionId, sock) => {
        const msg = data.messages[0];
        if (msg.key.fromMe) return; // Ignore messages sent by the bot

        const text = msg.message?.conversation || "";
        const command = text.split(" ")[0]; // Extract command from message

        switch (command) {
            case "status":
                // Get and send the session status
                const status = WhatsMulti.getSessionStatus(sessionId);
                WhatsMulti.sendMessage(sessionId, msg, {
                    text: `Status: ${sessionId} is ${status}`
                });
                break;

            case "allsessions":
                // List all active sessions
                const sessions = WhatsMulti.getSessions();
                WhatsMulti.sendMessage(sessionId, msg, {
                    text: `Total Sessions: ${sessions.length}\n${sessions.join("\n")}`
                });
                break;

            case "create":
                // Create a new session dynamically
                let newSessionId = text.split(" ")[1] || "session-2";
                WhatsMulti.createSession({
                    sessionId: newSessionId,
                    connectionType: "local",
                    options: { printQrOnTerminal: false } // Prevent QR from printing in terminal
                });

                // Send QR code when it's generated
                WhatsMulti.on('qr', (qr, sessionId) => {
                    if (sessionId === newSessionId) {
                        WhatsMulti.sendMessage(sessionId, msg, { image: qr.image, caption: "Scan QR Code." });
                    }
                });

                // Notify when the session is connected
                WhatsMulti.on('connected', (_, sessionId) => {
                    if (sessionId === newSessionId) {
                        WhatsMulti.sendMessage(sessionId, msg, {
                            text: `Session ${newSessionId} is Connected.`
                        });
                    }
                });
                break;

            case "delete":
                // Delete an existing session
                sessionId = text.split(" ")[1] || "session-1";
                WhatsMulti.deleteSession(sessionId);
                WhatsMulti.sendMessage(sessionId, msg, {
                    text: `Session ${sessionId} has been deleted.`
                });
                break;
        }
    });
}

// Start the example
start();
