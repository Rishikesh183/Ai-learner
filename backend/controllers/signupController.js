import CryptoJS from "crypto-js";
import User from "../models/User.js"
const signupHandler = async (req, res) => {
    const email = await req.body.email
    try {
        const exsistingUserVerifiedByUsername = await User.findOne({ email })
        if (exsistingUserVerifiedByUsername) {
            return res.json({ success: false, message: "This email has been taken , try different one" }, { status: 400 })
        }
        else {
            const newUser = new User({
                username: req.body.username,
                number: req.body.number,
                email: req.body.email,
                password: CryptoJS.AES.encrypt(req.body.password, process.env.PASSWORD_SECRET_KEY || "Rishi@183").toString()
            });
            const savedUser = await newUser.save()
            res.status(201).json(savedUser)
        }

    } catch (error) {
        res.status(500).json({ "message": "Error while creating the user" })
        console.log(error);
    }
}

export default signupHandler