'use strict';

module.exports = () => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache.js, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache.js');
    res.setHeader('Expires', 0);
    return next();
  };
};
