import express from 'express';

import configsRoutes from './routes/config.routes';


var cors = require('cors')

const app = express();

app.set('port', process.env.PORT || 3005);
app.use(express.json());
app.use(cors())
app.use('/api/config', configsRoutes)
export default app;