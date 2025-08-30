const Joi = require('joi');

const taskSchema = Joi.object({
  clientName: Joi.string().required().min(1).max(255),
  taskDescription: Joi.string().required().min(1),
  dateCommissioned: Joi.date().iso().allow(null, ''),
  dateDelivered: Joi.date().iso().allow(null, ''),
  expectedAmount: Joi.number().min(0).required(),
  isPaid: Joi.boolean().default(false)
});

const validateTask = (req, res, next) => {
  const { error, value } = taskSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID'
    });
  }
  
  req.params.id = id;
  next();
};

module.exports = { validateTask, validateId };