import { EventEmitter } from 'events';
import { EventMap, EventMapKey, MetaEventCallbackType } from '../Types';

type Listener<K extends EventMapKey> = (data: EventMap[K], meta: MetaEventCallbackType) => void;

export class WMEventEmitter extends EventEmitter {
    override on<K extends EventMapKey>(event: K, listener: Listener<K>): this {
        return super.on(event, listener);
    }

    override once<K extends EventMapKey>(event: K, listener: Listener<K>): this {
        return super.once(event, listener);
    }

    override off<K extends EventMapKey>(event: K, listener: Listener<K>): this {
        return super.off(event, listener);
    }

    override emit<K extends EventMapKey>(event: K, data: EventMap[K], meta: MetaEventCallbackType): boolean {
        return super.emit(event, data, meta);
    }
}
