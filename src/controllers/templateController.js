import {
  listActiveTemplates,
  listAllTemplates,
  createTemplateRecord,
  updateTemplateRecord,
} from "../services/templateService.js";
import {
  validateTemplateCatalogCreate,
  validateTemplateCatalogUpdate,
} from "../utils/validators.js";

export const listTemplates = async (_req, res, next) => {
  try {
    const templates = await listActiveTemplates();
    return res.json({ templates });
  } catch (error) {
    return next(error);
  }
};

export const listTemplatesAdmin = async (_req, res, next) => {
  try {
    const templates = await listAllTemplates();
    return res.json({ templates });
  } catch (error) {
    return next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const payload = await validateTemplateCatalogCreate(req.body);
    const template = await createTemplateRecord(payload);
    return res.status(201).json({ template });
  } catch (error) {
    if (error.code === "23505") {
      res.status(409);
      return next(new Error("Template slug already exists."));
    }
    return next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const payload = await validateTemplateCatalogUpdate(req.body);
    const template = await updateTemplateRecord(req.params.slug, payload);
    return res.json({ template });
  } catch (error) {
    return next(error);
  }
};
