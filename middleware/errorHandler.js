const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ ok: false, error: 'Server error' });
  };

module.exports = errorHandler