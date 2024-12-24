const prisma = require("../config/prisma")

exports.listUsers = async (req, res) => {
    try {
        ///code
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                enabled: true,
                address: true
            }
        })
        res.json(users)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.changeStatus = async (req, res) => {
    try {
        ///code
        const { id, enabled } = req.body
        console.log(id, enabled)
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { enabled }
        })

        res.send('Update Status Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.changeRole = async (req, res) => {
    try {
        ///code
        const { id, role } = req.body

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { role }
        })


        res.send('Update Role Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.userCart = async (req, res) => {
    try {
        ///code
        const { cart } = req.body
        console.log(cart)
        console.log(req.user.id)

        const user = await prisma.user.findFirst({
            where: { id: Number(req.user.id) }
        })
        // console.log(user)
        // check quantity
        for (const item of cart) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
                select: { quantity: true, title: true }
            })
            // console.log(item)
            // console.log(product)
            if (!product || item.count > product.quantity) {
                return res.status(400).json({
                    ok: false,
                    message: `ขออภัย, สินค้า ${product?.title || 'prduct'} หมด`
                })
            }
        }

        // delete old cart item การลบข้อมูลเก่าเพื่อเคลียร์ตะกร้า เพื่อที่จะเพิ่มสินค้าใหม่เข้าไป
        await prisma.productOnCart.deleteMany({
            where: {
                cart: {
                    orderedById: user.id
                }
            }
        })
        // delete old cart 
        await prisma.cart.deleteMany({
            where: { orderedById: user.id }
        })
        // เตรียมสินค้า
        let products = cart.map((item) => ({
            productId: item.id,
            count: item.count,
            price: item.price
        }))

        //การคำนวณหาผลรวม  *reduce 
        let cartTotal = products.reduce((sum, item) =>
            sum + item.price * item.count, 0)


        // new cart 
        const newCart = await prisma.cart.create({
            data: {
                products: {
                    create: products
                },
                cartTotal: cartTotal,
                orderedById: user.id
            }
        })
        console.log(newCart)



        res.send('Add Cart Ok')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.getUserCart = async (req, res) => {
    try {
        ///code
        // req.user.id 
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: Number(req.user.id)
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        })
        // console.log(cart)
        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.emptyCart = async (req, res) => {
    try {
        ///code
        const cart = await prisma.cart.findFirst({
            where: { orderedById: Number(req.user.id) }
        })
        if (!cart) {
            return res.status(400).json({ message: 'No Cart!' })
        }
        //delete productOnCart
        await prisma.productOnCart.deleteMany({
            where: { cartId: cart.id }
        })
        //delete Cart
        const result = await prisma.cart.deleteMany({
            where: { orderedById: Number(req.user.id) }
        })

        console.log(result)
        res.json({
            message: ' Cart Empty Success ',
            deletedCount: result.count
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.saveAddress = async (req, res) => {
    try {
        ///code
        const { address } = req.body
        console.log(address)
        const addressUser = await prisma.user.update({
            where: {
                id: Number(req.user.id)
            },
            data: {
                address: address
            }
        })

        res.json({
            ok: true,
            message: 'Address Update Success'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.saveOrder = async (req, res) => {
    try {
        ///code
        // step 0 Check stripe 
        // console.log(req.body)
        // return res.send('Hello Yoshi!!')
       
        const { id, amount ,status, currency } =req.body.paymentIntent

        // step1 get user cart
        const userCart = await prisma.cart.findFirst({
            where: {
                orderedById: Number(req.user.id)
            },
            include: { products: true }
        })
        // check empty
        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({ ok: false, message: 'Cart is Empty' })
        }
       

        const amountTHB = Number(amount) /100
        // create New order ถ้ามันผ่านเงื่อนไขถ้าสินค้าไม่หมด
        const order = await prisma.order.create({
            data: {
                products: {
                    create: userCart.products.map((item) => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderedBy: {
                    connect: { id: req.user.id }
                },
                cartTotal: userCart.cartTotal,
                stripePaymentId : id,
                amount : amountTHB,
                status: status,
                currentcy: currency
  
            }
        })
        // stripePaymentId String?
        // amount  Int?
        // status  String?
        // currentcy String?

        // update product
        const update = userCart.products.map((item) => ({
            where: { id: item.productId },
            data: {
                quantity: { decrement: item.count },
                sold: { increment: item.count }
            }
        }))

        console.log(update)

        await Promise.all(
            update.map((updated) => prisma.product.update(updated))
        )

        await prisma.cart.deleteMany({
            where: { orderedById: Number(req.user.id) }
        })

        res.json({ ok: true, order })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}
exports.getOrder = async (req, res) => {
    try {
        ///code
        const orders = await prisma.order.findMany({
            where: { orderedById: Number(req.user.id) },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        })
        if (!orders.length === 0) {
            return res.statud(400)
                .json({ ok: false, message: 'No Order' })
        }
        // console.log(orders)
        res.json({ ok: true, orders })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Erorr' })
    }
}