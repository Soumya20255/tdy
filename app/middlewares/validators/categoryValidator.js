const Joi = require('joi');

const categoryValidationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 3 characters long',
      'string.max': 'Category name must not exceed 20 characters',
      'any.required': 'Category name is required'
    })
  ,
  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 500 characters',
      'any.required': 'Description is required'
    })
});

const validateCategory = (req, res, next) => {
  const { error, value } = categoryValidationSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    req.flash('error', errors.join(', '));
    const redirectUrl = req.get('Referrer') || req.get('Referer') || '/admin/categories';
    return res.redirect(redirectUrl);
  }

  // Assign validated (and trimmed) values back to req.body so downstream code uses sanitized data
  req.body = value;

  next();
};

module.exports = { validateCategory };
