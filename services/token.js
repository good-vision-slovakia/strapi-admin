'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

const defaultJwtOptions = { expiresIn: '30d' };

const getTokenOptions = () => {
  const { options, secret } = strapi.config.get('server.admin.auth', {});

  return {
    secret,
    options: _.merge(defaultJwtOptions, options),
  };
};

/**
 * Create a random token
 * @returns {string}
 */
const createToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

/**
 * Creates a JWT token for an administration user
 * @param {object} user - admin user
 */
const createJwtToken = async (user) => {
  const { options, secret } = getTokenOptions();
  const regions = await strapi.connections.default.raw(`
  SELECT json_build_object('region', region_id) as regions FROM regions__admin_users
  WHERE user_id = ?;`, [user.id])

  let regionsToClaims = [];

  if (!_.isEmpty(regions.rows)) {
    regions.rows.forEach(region => {
      regionsToClaims.push(region.regions.region);
    });
  } else {
    regionsToClaims.push(0);
  }

  return jwt.sign({ id: user.id, regions: regionsToClaims }, secret, options);
};

/**
 * Tries to decode a token an return its payload and if it is valid
 * @param {string} token - a token to decode
 * @return {Object} decodeInfo - the decoded info
 */
const decodeJwtToken = token => {
  const { secret } = getTokenOptions();

  try {
    const payload = jwt.verify(token, secret);
    return { payload, isValid: true };
  } catch (err) {
    return { payload: null, isValid: false };
  }
};

module.exports = {
  createToken,
  createJwtToken,
  getTokenOptions,
  decodeJwtToken,
};
