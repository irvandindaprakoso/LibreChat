const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
} = require('~/server/controllers/AdminUserController');

const router = express.Router();

// All routes require admin authentication
router.use(requireJwtAuth);

// Get all users
router.get('/', getUsersController);

// Get a specific user
router.get('/:userId', getUserController);

// Create a new user
router.post('/', createUserController);

// Update a user
router.put('/:userId', updateUserController);

// Delete a user
router.delete('/:userId', deleteUserController);

module.exports = router;
