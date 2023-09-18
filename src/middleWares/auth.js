const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel')
const {isValidInputValue,isValidInputBody,isValidObjectId} = require('../utilities/validator')

const authentication = function (req, res, next) {
    try {
        let token = req.headers['x'];

        if (!token) {
            return res.status(401).send({ status: false, message: "necessary header token is missing" });
        }
        
        jwt.verify(token, "123", (err, decoded) => {
            if (err) {
                return res.status(403).send({ status: false, message: "failed authentication" });
            }
          
            // If authentication is successful, you can store the decoded information in the request object
            req.user = decoded;
            next();
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



//********************************AUTHORIZATION********************************** */

const authorization = async function(req, res, next) {
    const userId = req.body.userId
    
    if (!isValidInputBody(req.body)) {
        return res.status(400).send({
          status: false,
          message: "data is required."
        });
      }
    console.log('userId in body',userId)
    const decodedToken = req.user
    console.log('decodedToken',decodedToken.userId)


    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: " enter a valid userId" })
    }

    const userByUserId = await UserModel.findById(userId)

    if (!userByUserId) {
        return res.status(404).send({ status: false, message: " user not found" })
    }

    if (userId !== decodedToken.userId) {
        return res.status(403).send({ status: false, message: "unauthorized access" })
    }
    next()
}




//authenticateAdmin
function authenticateAdmin(req, res, next) {
   try{ const token = req.header('x'); // Assuming the token is sent in the request header
  
    if (!token) {
      return res.status(401).json({ status: false, message: 'Access denied. No token provided.' });
    }
  
      jwt.verify(token, '123', (err, decoded) => {
        if (err) {
            return res.status(403).send({ status: false, message: "failed authentication" });
        }
      
        req.admin = decoded;// Store admin information in the request for further use
        next();
    });
    } catch (error) {
      res.status(401).json({ status: false, message: 'Invalid token.' });
    }
  }
  
module.exports = { authentication, authorization,authenticateAdmin }
