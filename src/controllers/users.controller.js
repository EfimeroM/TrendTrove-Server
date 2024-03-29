const UserDAO = require('../db/daos/usersDAO')
const { passwordIsValid } = require('../utils/bcrypt')
const { generateToken } = require('../utils/jwt')
require('dotenv').config()

class UserController {
  constructor () {
    this.dao = new UserDAO()
    this.nameDao = this.constructor.name.replace('Controller', '').toLowerCase()
  }

  handleResponse = (res, status, message, data = {}) => res.status(status).json({ message, data })

  signup = async (req, res) => {
    try {
      const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      }
      const user = await this.dao.add(newUser)
      this.handleResponse(res, 201, 'User added', user)
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body
      let user = await this.dao.getByEmail(email)
      if (!user) return this.handleResponse(res, 404, 'User not found')
      if (!passwordIsValid(user, password)) return this.handleResponse(res, 401, 'Invalid password')
      const payload = { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
      const token = generateToken(payload, process.env.JWT_SECRET_KEY)
      user = { ...payload, token }
      this.handleResponse(res, 200, 'User logged', user)
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }

  getUserByToken = async (req, res) => {
    try {
      let user = req.user
      if (!user) return this.handleResponse(res, 404, 'User not found')
      const dataUser = await this.dao.getByEmail(user.email)
      user = { ...user, wishlist: dataUser.wishlist }
      this.handleResponse(res, 200, 'User found', user)
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }

  addProductInWishList = async (req, res) => {
    try {
      const userId = req.user.id
      const product = req.body
      await this.dao.addProductWishList(userId, product)
      this.handleResponse(res, 201, 'Product added in wish list')
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }

  deleteProductInWishList = async (req, res) => {
    try {
      const userId = req.user.id
      const product = req.body
      await this.dao.deleteProductWishList(userId, product._id)
      this.handleResponse(res, 200, 'Product deleted in wish list')
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }

  getWishListById = async (req, res) => {
    try {
      const userId = req.user.id
      const wishlist = await this.dao.getWishList(userId)
      this.handleResponse(res, 200, 'Wishlist found', wishlist)
    } catch (error) {
      this.handleResponse(res, 500, error.message)
    }
  }
}

module.exports = UserController
