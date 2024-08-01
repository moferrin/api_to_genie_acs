import jwt from 'jsonwebtoken'
import config from '../config'
import User from '../models/user.model.js'


export const authRequired = (req, res, next) => {
    const { token } = req.cookies

    if (!token) return res.status(401).json({ message: 'Authentication required' })
    jwt.verify(token, config.TOKEN_SECRET_KEY, async (err, user) => {
        if (err) return res.status(err).json({ message: "Invalid token" })
        const userFound = await User.findOne({_id: user.id});
        if (!userFound) return res.status(401).json({ message: 'User not found' })
        req.user = user
        req.rol = userFound.rol
        req.cedulaRUC = userFound.cedulaRUC
        next()
    }) 
}