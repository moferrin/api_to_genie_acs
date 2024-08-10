import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'
import config from '../config'
import jwt from 'jsonwebtoken'
import axios from 'axios'

export const register = async (req, res) => {
    const { cedulaRUC, names, password, isAdmin } = req.body
    try {
        const userFound = await User.findOne({ cedulaRUC })
        if (userFound) return res.status(400).json({ message: ['Ya existe un usuario registrado con ese cedulaRUC'] })
        const passwordHash = await bcrypt.hash(password, 10)
        const newUser = new User({
            cedulaRUC,
            names,
            isAdmin,
            password: passwordHash,
            isAdmin: false
        });
        const userSaved = await newUser.save();
        const userData = {
            id: userSaved._id,
            names: userSaved.names,
            cedulaRUC: userSaved.cedulaRUC,
            password: userSaved.password,
            isAdmin: userSaved.isAdmin,
            createAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt
        }
        const token = await createAccessToken({ id: userSaved._id });
        res.cookie('token', token)
        res.json({
            menssage: 'User created successfully'
        })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

export const login = async (req, res) => {
    const { cedulaRUC, password } = req.body
    try {
        const userFound = await User.findOne({ cedulaRUC})
        if (!userFound) return res.status(400).json({ message: 'Usuario no encontrado' });
        const isMatch = await bcrypt.compare(password, userFound.password)
        if (!isMatch) return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });
        const token = await createAccessToken({ id: userFound._id });
        res.cookie('token', token)
        res.json({
            menssage: 'El usuario ha iniciado sesión exitosamente',
            token: token,
            isAdmin: userFound.isAdmin
        })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}
export const logout = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
    });
    return res.sendStatus(200);
};
export const profile = async (req, res) => {
    const userFound = await User.findById(req.user.id)
    if (!userFound) return res.status(400).json({ message: 'User not found' })
    return res.json({
        id: userFound._id,
        cedulaRUC: userFound.cedulaRUC,
        names: userFound.names,
        isAdmin: userFound.isAdmin,
        createdAt: userFound.createdAt,
        updatedAt: userFound.updatedAt
    })
}
export const verifyToken = async (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.send(false);

    jwt.verify(token, config.TOKEN_SECRET_KEY, async (error, user) => {
        if (error) return res.sendStatus(401);

        const userFound = await User.findById(user.id);
        if (!userFound) return res.sendStatus(401);

        return res.json({
            id: userFound._id,
            names: userFound.names,
            cedulaRUC: userFound.cedulaRUC,
            isAdmin: userFound.isAdmin
        });
    });
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};


export const deleteUser = async (req, res) => {
    const { cedulaRUC } = req.body;
    try {
        const userFound = await User.findOneAndDelete({ cedulaRUC});
        if (!userFound) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateUser = async (req, res) => {
    const { cedulaRUC, names, password, isAdmin } = req.body;
    try {
        const userFound = await User.findOne({ cedulaRUC });
        if (!userFound) return res.status(404).json({ message: 'Usuario no encontrado' });

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            userFound.password = passwordHash;
        }
        userFound.names = names || userFound.names;
        userFound.isAdmin = typeof isAdmin === 'boolean' ? isAdmin : userFound.isAdmin;

        const updatedUser = await userFound.save();
        res.json({
            message: 'Usuario actualizado exitosamente'
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};



export const fetchDevices = async (req, res) => {
    try {
        const response = await axios.get('http://45.173.112.9:7557/devices');
        const devices = response.data.map(device => {
            // Inicializar WANDevice como null
            let WANDevice = null;
            // Buscar en WANConnectionDevice desde '1' hasta '8'
            for (let i = 1; i <= 8; i++) {
                // Verificar si el objeto y la propiedad deseada existen
                if (device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i] &&
                    device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'] &&
                    device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value']) {
                    // Asignar el valor de ExternalIPAddress a WANDevice
                    WANDevice = device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value'];
                    // Salir del bucle una vez que se encuentra el dato
                    break;
                }
            }
            // Devolver el objeto con la propiedad WANDevice solo si se encontró un valor
            return {
                _id: device._id,
                _Manufacturer: device._deviceId._Manufacturer,
                WANDevice, // Esto será null si no se encontró ningún valor
                _ProductClass: device._deviceId._ProductClass,
                _SerialNumber: device._deviceId._SerialNumber,
            };
        });
        return res.json(devices);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los dispositivos', error: error.message });
    }
};