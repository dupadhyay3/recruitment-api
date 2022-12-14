import jwt from 'jsonwebtoken'
import { admin } from '../Modal/modals.js'
var checkAdminAuth = async (req, res, next) => {
  let token
  const { authorization } = req.headers
  console.log("authorizationnnnnnnnnnnnnnnn", authorization);
  if (authorization && authorization.startsWith('Bearer')) {
    try {
      // Get Token from header
      token = authorization.split(' ')[1]
      // Verify Token
      console.log(jwt.verify(token, process.env.JWT_SECRET_KEY));
      const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const _id=userID
      // Get User from Token
      req.user = await admin.findById(_id).select('-password')
      console.log(req.user, "requesr from user");
      next()
    } catch (error) {
      console.log("jwterrrrrrrrrrrrrrrrr",error)
      res.status(401).send({ "status": "failed", "message": "Unauthorized User" })
    }
  }
  if (!token) {
    res.status(401).send({ "status": "failed", "message": "Unauthorized User, No Token" })
  }
}

export default checkAdminAuth