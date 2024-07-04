const jwt = require('jsonwebtoken');
const Students = require('../models/studentModel')


exports.protect = async (req, res, next) => {
    try {
        if (req.headers?.authorization && req.headers?.authorization?.startsWith('JWT')) {
            //verify the token
            const token = req.headers?.authorization?.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            //find user in DB using 
            const user = await Students.findById({ _id: decoded.id }).select('-__v -createdAt');

            if (!user) {
                throw Error('Student account does not exit. Please contact school Administrator')
            }
            // add user object to the req
            req.user = user;

            next();

        } else {
            //throw an errow
            throw Error('You are not logged in. Please login to gain access')
        }

    } catch (error) {
        res.status(401).json({
            status: 'failed',
            error,
            message: error.message
        })
    }
}
