const jwt = require('jsonwebtoken');
const Staff = require('../models/staffModel');
const Students = require('../models/studentModel')


exports.studentProtect = async (req, res, next) => {
    try {
        if (req.headers?.authorization && req.headers?.authorization?.startsWith('JWT')) {
            //verify the token
            const token = req.headers?.authorization?.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            //find user in DB using 
            const user = await Students.findById({ _id: decoded.id }).select('-__v -createdAt');

            if (!user) {
                throw Error('Applicant account does not exit. Please contact school Administrator')
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


exports.staffProtect = async (req, res, next) => {
    try {
        if (req.headers?.authorization && req.headers?.authorization?.startsWith('JWT')) {
            //verify the token
            const token = req.headers?.authorization?.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            //find user in DB using 
            const user = await Staff.findById({ _id: decoded.id }).select('-__v -createdAt');

            if (!user) {
                throw Error('Staff account does not exit. Please contact School Administrator')
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

exports.adminProtect = async (req, res, next) => {
    try {
        if (req.headers?.authorization && req.headers?.authorization?.startsWith('JWT')) {
            //verify the token
            const token = req.headers?.authorization?.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            //find user in DB using 
            const user = await Staff.findById({ _id: decoded.id }).select('-__v -createdAt');

            if (!user || user.role !== 'admin') {
                throw Error('Permission denied. Please contact School Administrator')
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