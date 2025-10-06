import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const createPawnSchema = Joi.object({
  ethAmount: Joi.string().pattern(/^\d+(\.\d+)?$/).required()
    .messages({
      'string.pattern.base': 'ETH amount must be a valid number'
    })
});

const redeemPawnSchema = Joi.object({
  positionId: Joi.number().integer().positive().required(),
  usdtAmount: Joi.string().pattern(/^\d+(\.\d+)?$/).required()
    .messages({
      'string.pattern.base': 'USDT amount must be a valid number'
    })
});

export const validateCreatePawn = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createPawnSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateRedeemPawn = (req: Request, res: Response, next: NextFunction) => {
  const { error } = redeemPawnSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
