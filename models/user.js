const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    id: { type: String, default: Date.now().toString() },
    name: { type: String, required: true },
    email: { type: String, required: true },
    hashedPassword: { type: String, required: true },
    code: { type:Number, required: true }
})

module.exports = mongoose.model("User", userSchema)
