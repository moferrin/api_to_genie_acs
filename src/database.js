import mongoose from "mongoose";
import config from './config'

(async () => {
    try {
        await mongoose.connect(config.mongodbURL);
        console.log("DB connection established");
    } catch (e) {
        console.log("This error: " + e);
    }

    // const db = await mongoose.connect(config.mongodbURL, {
    // })
    // console.log('Database is connected to: ',db.connection.name)
})();