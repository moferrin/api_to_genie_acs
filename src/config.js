import { config } from "dotenv"
config();

export default{
    mongodbURL:'mongodb://localhost/tesis',
    TOKEN_SECRET_KEY : "some secret key"
}
