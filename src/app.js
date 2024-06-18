import express from 'express';

import configsRoutes from './routes/config.routes';




const app = express();

app.set('port', process.env.PORT || 3006);
app.use(express.json());

app.use('/api/config', configsRoutes)
//app.use('/api/clientes', clientesRoutes);
//app.use('/api/pedidos', pedidosRoutes);

export default app;