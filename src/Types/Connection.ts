export type ConnectionType = "local" | "mongodb" | "supabase";

export type AuthStateType = {
    sessionId: string;
    connectionType: ConnectionType;
}
