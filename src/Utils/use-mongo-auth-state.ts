import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import { mongoose } from './mongo-client';

interface AuthStateDocument {
    _id: string;
    data: string;
}

let AuthenticationStateModel: mongoose.Model<AuthStateDocument>;

const useMongoAuthState = async (sessionId: string) => {
    if (!AuthenticationStateModel) {
        const schema = new mongoose.Schema({
            _id: { type: String, required: true },
            data: String,
        });
        AuthenticationStateModel = mongoose.model<AuthStateDocument>(sessionId, schema);
    }

    const fixFileName = (file: string) => file.replace(/\//g, '__').replace(/:/g, '-');

    const writeData = async (data: unknown, file: string) =>
        AuthenticationStateModel.updateOne(
            { _id: fixFileName(file) },
            { $set: { data: JSON.stringify(data, BufferJSON.replacer) } },
            { upsert: true }
        );

    const readData = async (file: string) => {
        const doc = await AuthenticationStateModel.findOne({ _id: fixFileName(file) });
        return doc ? JSON.parse(doc.data, BufferJSON.reviver) : null;
    };

    const removeData = async (file: string) => AuthenticationStateModel.deleteOne({ _id: fixFileName(file) });

    const creds = (await readData('creds')) ?? initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const entries = await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            return [id, value];
                        })
                    );
                    return Object.fromEntries(entries);
                },
                set: async (data: Record<string, Record<string, unknown>>) => {
                    const tasks: Promise<unknown>[] = [];
                    for (const [category, items] of Object.entries(data)) {
                        for (const [id, value] of Object.entries(items)) {
                            const file = `${category}-${id}`;
                            tasks.push(value ? writeData(value, file) : removeData(file));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        },
    };
};

export { useMongoAuthState };
