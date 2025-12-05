import {
  getSettings,
  updateSettings,
  updateNotificationPrefs,
  updatePrivacyPrefs,
  deleteAccount,
} from "../services/settingsService.js";
import { validateSettings } from "../utils/validators.js";

export const getUserSettings = async (req, res, next) => {
  try {
    const settings = await getSettings(req.user.id);
    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
};

export const patchUserSettings = async (req, res, next) => {
  try {
    const validated = await validateSettings(req.body);
    const settings = await updateSettings(req.user.id, validated);
    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
};

export const patchNotificationSettings = async (req, res, next) => {
  try {
    const settings = await updateNotificationPrefs(req.user.id, req.body);
    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
};

export const patchPrivacySettings = async (req, res, next) => {
  try {
    const settings = await updatePrivacyPrefs(req.user.id, req.body);
    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword) {
      res.status(400);
      throw new Error("Password confirmation required.");
    }
    await deleteAccount(req.user.id, confirmPassword);
    return res.json({ message: "Account deleted successfully." });
  } catch (error) {
    return next(error);
  }
};
