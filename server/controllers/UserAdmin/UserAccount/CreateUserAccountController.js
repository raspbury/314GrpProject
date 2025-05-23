import { User } from '../../../models/User.js';
import { UserAccountEntity } from '../../../entities/UserAccountEntity.js';
import pool from '../../../db.js';

/**
 * Controller for handling the creation of user accounts via admin requests.
 */
export class CreateUserAccountController {
  /** @type {UserAccountEntity} */
  userAccountEntity;

  constructor() {
    this.UserAccountEntity = new UserAccountEntity(pool);
  }

  /**
   * Handles POST /api/useradmin/account
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createAccount = async (req, res) => {
    const { username, password, role } = req.body;

    const newUserModel = new User(username, password, role);

    try {
      const success = await this.UserAccountEntity.createUser(newUserModel);
      if (success) {
        res.status(200).json(true);
      } else {
        res.status(500).json(false);
      }
    } catch (error) {
      res.status(500).json(false);
    }
  }
}