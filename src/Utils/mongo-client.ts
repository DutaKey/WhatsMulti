import mongoose from 'mongoose';
import { Configs } from '../Stores';
import { logger } from './logger';

const connectToMongo = async () => {
    try {
        const mongoUri = Configs.getValue('mongoUri');
        if (!mongoUri) return logger.error('Mongo URI is not defined');

        logger.info('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error(error);
    }
};

const isMongoDBConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};

export { connectToMongo, mongoose, isMongoDBConnected };
