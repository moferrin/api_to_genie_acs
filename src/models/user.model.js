import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    names: {type: String, required: true, trim: true},
    cedulaRUC: {type: String, required: true, trim: true, unique: true},
    password: {type: String, required: true, trim: true},
    isAdmin: {type: 'boolean', required: true, trim: true}
    //devices: [{ type: String, required: true, trim: true }]
}, {
    timestamps: true,
})

export default mongoose.model('User', userSchema);