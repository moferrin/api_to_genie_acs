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
app.use(cors({
    'origin':"http://localhost:5173",
    credentials:true
}));
app.use(cookieParser());

app.use(morgan('dev'));

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static('public'))

app.use('/api/config', configsRoutes)

app.use('/api', authRoutes)

app.use("*",express.static("public"));
   
export default app;