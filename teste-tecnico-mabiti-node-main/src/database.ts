import mongoose from 'mongoose';
import { env as env_db} from './env/index.env';

const env = {
MONGO_URI: `mongodb+srv://pablosautner:${env_db.DB_PASSWORD}@map.umiyjqg.mongodb.net/?retryWrites=true&w=majority&appName=Map`};

const init = async function() {
  await mongoose.connect(env.MONGO_URI);
};

export default init();
