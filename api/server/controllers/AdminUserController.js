const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const {
  updateUser,
  deleteUserById,
} = require('~/models');
const { User } = require('~/db/models');
const { registerUser } = require('~/server/services/AuthService');


/**
 * Get all users (admin only)
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const getUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get users with pagination using User model directly
    const users = await User.find(query, 'email username name role provider avatar createdAt emailVerified lastActiveAt subscription')
      .where('role').ne(SystemRoles.ADMIN)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    // Remove sensitive information (users are already plain objects due to .lean())
    const sanitizedUsers = users.map(user => {
      const userObj = { ...user };
      delete userObj.password;
      delete userObj.totpSecret;
      delete userObj.refreshToken;
      return userObj;
    });

    res.status(200).json({
      users: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('[getUsersController] Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * Get a specific user by ID (admin only)
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const getUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.totpSecret;
    delete userObj.refreshToken;

    res.status(200).json(userObj);
  } catch (error) {
    logger.error('[getUserController] Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

/**
 * Create a new user (admin only)
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const createUserController = async (req, res) => {
  try {
    const { email, password, name, username, role = SystemRoles.USER, emailVerified = true } = req.body;

    // Validate required fields
    if (!email || !password || !name || !username) {
      return res.status(400).json({ 
        message: 'Email, password, name, and username are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    }, 'email username').lean();

    if (existingUser) {
      return res.status(409).json({ 
        message: 'A user with that email or username already exists' 
      });
    }

    // Validate role
    if (!Object.values(SystemRoles).includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role specified' 
      });
    }

    // Create user data
    const userData = {
      email,
      password,
      name,
      username,
      confirm_password: password,
      role,
      emailVerified
    };

    // Use the existing registerUser service
    const result = await registerUser(userData, { emailVerified });
    
    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.message });
    }

    // Get the created user
    const newUser = await User.findOne({ email }, 'email username name role createdAt emailVerified').lean();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    logger.error('[createUserController] Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

/**
 * Update a user (admin only)
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const updateUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user exists
    const existingUser = await User.findById(userId).lean();
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating certain fields
    const allowedFields = [
      'name', 'subscription'
    ];
    
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Update the user
    const updatedUser = await updateUser(userId, filteredData);
    
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update user' });
    }

    // Get updated user data
    const user = await User.findById(userId).lean();
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.totpSecret;
    delete userObj.refreshToken;

    res.status(200).json({
      message: 'User updated successfully',
      user: userObj
    });
  } catch (error) {
    logger.error('[updateUserController] Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

/**
 * Delete a user (admin only)
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const deleteUserController = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user exists
    const existingUser = await User.findById(userId).lean();
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin user
    if (existingUser.role === SystemRoles.ADMIN) {
      const adminCount = await User.countDocuments({ role: SystemRoles.ADMIN });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last admin user' 
        });
      }
    }

    // Delete the user
    const result = await deleteUserById(userId);
    
    if (!result) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }

    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUserId: userId
    });
  } catch (error) {
    logger.error('[deleteUserController] Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
};
