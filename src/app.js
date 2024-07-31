import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'

import configsRoutes from './routes/config.routes';
import authRoutes from './routes/auth.routes';

import cors from 'cors';

const app = express();
const path = require('path');

app.set('port', process.env.PORT || 3005);
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use(morgan('dev'));


app.use('/api/config', configsRoutes)

app.use('/api', authRoutes)

app.use('*',express.static(path.join(__dirname, '../public')));

  
export default app;