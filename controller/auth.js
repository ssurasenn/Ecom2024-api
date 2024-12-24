const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    try {
        //Code
        const { email, password } = req.body

        // step1 Validate body
        if (!email) {
            return res.status(400).json({ message: "email is not required!!!" })
        }
        if (!password) {
            return res.status(400).json({ message: "password is not required!!!" })
        }

        //step2 check email in db already ?
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (user) {
            return res.status(400).json({ message: "Email already exist!!!" })
        }
        /// Step 3 Hashpassword
        const hashpassword = await bcrypt.hash(password, 10)
        // console.log(hashpassword);

        // STEP 4  register 
        await prisma.user.create({
            data: {
                email: email,
                password: hashpassword
            }
        })

        res.send('Register Success')

    } catch (err) {
        //err
        console.log(err)
        req.status(500).json({ message: "server error" })
    }
}

exports.login = async (req, res) => {
    try {
        //Code
        const { email, password } = req.body

        // step 1 check email
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (!user || !user.enabled) {
            return res.status(400).json({ message: 'User Not found or not Enabled' })
        }
        // step 2 check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Password Invalid' })
        }
        // step 3 create payload
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        // step 4 genarate token
        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                return req.status(500).json({ message: "Server Error" })
            }
            res.json({ payload, token })
        })

    } catch (err) {
        //err
        console.log(err)
        req.status(500).json({ message: "server error" })
    }
}
exports.currentUser = async (req, res) => {
    try {
        //code
        const user = await prisma.user.findFirst({
            where: { email: req.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })
        res.json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
}

