const { generate2FATempToken } = require('~/server/services/twoFactorService');
const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const { User } = require('~/db/models');

/**
 * Check if user subscription has expired and update status to inactive if needed
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated user object
 */
const checkAndUpdateExpiredSubscription = async (user) => {
  try {
    if (!user.subscription || !user.subscription.expiresAt) {
      return user;
    }

    const now = new Date();
    const expiresAt = new Date(user.subscription.expiresAt);

    // Check if subscription has expired
    if (expiresAt < now && user.subscription.status === 'active') {
      logger.info(`Subscription expired for user ${user._id}, updating status to inactive`);
      
      // Update user subscription status to inactive
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            'subscription.status': 'inactive'
          }
        },
        { new: true, lean: true }
      );

      return updatedUser || user;
    }

    return user;
  } catch (error) {
    logger.error('[checkAndUpdateExpiredSubscription] Error checking subscription:', error);
    return user; // Return original user if error occurs
  }
};

const loginController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check and update expired subscription before proceeding
    const userWithUpdatedSubscription = await checkAndUpdateExpiredSubscription(req.user);

    if (userWithUpdatedSubscription.twoFactorEnabled) {
      const tempToken = generate2FATempToken(userWithUpdatedSubscription._id);
      return res.status(200).json({ twoFAPending: true, tempToken });
    }

    const { password: _p, totpSecret: _t, __v, ...user } = userWithUpdatedSubscription;
    user.id = user._id.toString();

    const token = await setAuthTokens(userWithUpdatedSubscription._id, res);

    return res.status(200).send({ token, user });
  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  loginController,
};
