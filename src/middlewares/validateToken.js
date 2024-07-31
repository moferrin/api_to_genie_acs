import jwt from 'jsonwebtoken'
import config from '../config'

export const authRequired = (req, res, next) => {
    const { token } = req.cookies
    console.log(token)
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    jwt.verify(token, config.TOKEN_SECRET_KEY, (err, user) => {
        if (err) return res.status(err).json({ message: "Invalid token" })
        req.user = user
        next()
    })
}