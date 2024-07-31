import jwt from 'jsonwebtoken'
import config from '../config'

export function createAccessToken(payload){
    return new Promise((resolve, reject) => {
        jwt.sign(payload, config.TOKEN_SECRET_KEY, {expiresIn: "1d"}, (err, token) => {
            if(err) reject(err)
            resolve(token)
        });
    })
}