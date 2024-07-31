import express from 'express';

import configsRoutes from './routes/config.routes';
var cors = require('cors')

const app = express();
const path = require('path');

app.set('port', process.env.PORT || 3005);
app.use(express.json());
app.use(cors())
app.use('/api/config', configsRoutes)

app.use('*',express.static(path.join(__dirname, '../public')));

  
export default app;