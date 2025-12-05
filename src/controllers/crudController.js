import {
  Links,
  Projects,
  Experiences,
  Education,
  Certifications,
  Skills,
  SocialLinks,
  Testimonials,
} from "../services/crudServices.js";
import {
  validateLink,
  validateProjectFull,
  validateExperienceFull,
  validateEducationFull,
  validateCertificationFull,
  validateSkill,
  validateSocialLink,
  validateTestimonial,
  validateReorder,
} from "../utils/validators.js";

// ========== LINKS ==========
export const listLinks = async (req, res, next) => {
  try {
    const dashboardId = req.params.dashboardId || req.query.dashboardId;
    const links = await Links.list(req.user.id, dashboardId);
    return res.json({ links });
  } catch (error) {
    return next(error);
  }
};

export const createLink = async (req, res, next) => {
  try {
    const validated = await validateLink(req.body);
    const link = await Links.create(req.user.id, validated);
    return res.status(201).json({ link });
  } catch (error) {
    return next(error);
  }
};

export const updateLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateLink(req.body);
    const link = await Links.update(req.user.id, id, validated);
    if (!link) {
      res.status(404);
      throw new Error("Link not found.");
    }
    return res.json({ link });
  } catch (error) {
    return next(error);
  }
};

export const deleteLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Links.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Link not found.");
    }
    return res.json({ message: "Link deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderLinks = async (req, res, next) => {
  try {
    const { order, dashboardId } = await validateReorder(req.body);
    await Links.reorder(req.user.id, dashboardId, order);
    return res.json({ message: "Links reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== PROJECTS ==========
export const listProjects = async (req, res, next) => {
  try {
    const projects = await Projects.list(req.user.id);
    return res.json({ projects });
  } catch (error) {
    return next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Projects.get(req.user.id, id);
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    return res.json({ project });
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const validated = await validateProjectFull(req.body);
    const project = await Projects.create(req.user.id, validated);
    return res.status(201).json({ project });
  } catch (error) {
    return next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateProjectFull(req.body);
    const project = await Projects.update(req.user.id, id, validated);
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    return res.json({ project });
  } catch (error) {
    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Projects.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Project not found.");
    }
    return res.json({ message: "Project deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderProjects = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Projects.reorder(req.user.id, order);
    return res.json({ message: "Projects reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== EXPERIENCE ==========
export const listExperiences = async (req, res, next) => {
  try {
    const experiences = await Experiences.list(req.user.id);
    return res.json({ experiences });
  } catch (error) {
    return next(error);
  }
};

export const createExperience = async (req, res, next) => {
  try {
    const validated = await validateExperienceFull(req.body);
    const experience = await Experiences.create(req.user.id, validated);
    return res.status(201).json({ experience });
  } catch (error) {
    return next(error);
  }
};

export const updateExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateExperienceFull(req.body);
    const experience = await Experiences.update(req.user.id, id, validated);
    if (!experience) {
      res.status(404);
      throw new Error("Experience not found.");
    }
    return res.json({ experience });
  } catch (error) {
    return next(error);
  }
};

export const deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Experiences.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Experience not found.");
    }
    return res.json({ message: "Experience deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderExperiences = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Experiences.reorder(req.user.id, order);
    return res.json({ message: "Experiences reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== EDUCATION ==========
export const listEducation = async (req, res, next) => {
  try {
    const education = await Education.list(req.user.id);
    return res.json({ education });
  } catch (error) {
    return next(error);
  }
};

export const createEducation = async (req, res, next) => {
  try {
    const validated = await validateEducationFull(req.body);
    const education = await Education.create(req.user.id, validated);
    return res.status(201).json({ education });
  } catch (error) {
    return next(error);
  }
};

export const updateEducation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateEducationFull(req.body);
    const education = await Education.update(req.user.id, id, validated);
    if (!education) {
      res.status(404);
      throw new Error("Education not found.");
    }
    return res.json({ education });
  } catch (error) {
    return next(error);
  }
};

export const deleteEducation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Education.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Education not found.");
    }
    return res.json({ message: "Education deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderEducation = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Education.reorder(req.user.id, order);
    return res.json({ message: "Education reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== CERTIFICATIONS ==========
export const listCertifications = async (req, res, next) => {
  try {
    const certifications = await Certifications.list(req.user.id);
    return res.json({ certifications });
  } catch (error) {
    return next(error);
  }
};

export const createCertification = async (req, res, next) => {
  try {
    const validated = await validateCertificationFull(req.body);
    const certification = await Certifications.create(req.user.id, validated);
    return res.status(201).json({ certification });
  } catch (error) {
    return next(error);
  }
};

export const updateCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateCertificationFull(req.body);
    const certification = await Certifications.update(
      req.user.id,
      id,
      validated
    );
    if (!certification) {
      res.status(404);
      throw new Error("Certification not found.");
    }
    return res.json({ certification });
  } catch (error) {
    return next(error);
  }
};

export const deleteCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Certifications.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Certification not found.");
    }
    return res.json({ message: "Certification deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderCertifications = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Certifications.reorder(req.user.id, order);
    return res.json({ message: "Certifications reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== SKILLS ==========
export const listSkills = async (req, res, next) => {
  try {
    const skills = await Skills.list(req.user.id);
    return res.json({ skills });
  } catch (error) {
    return next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const validated = await validateSkill(req.body);
    const skill = await Skills.create(req.user.id, validated);
    return res.status(201).json({ skill });
  } catch (error) {
    return next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateSkill(req.body);
    const skill = await Skills.update(req.user.id, id, validated);
    if (!skill) {
      res.status(404);
      throw new Error("Skill not found.");
    }
    return res.json({ skill });
  } catch (error) {
    return next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Skills.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Skill not found.");
    }
    return res.json({ message: "Skill deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderSkills = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Skills.reorder(req.user.id, order);
    return res.json({ message: "Skills reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== SOCIAL LINKS ==========
export const listSocialLinks = async (req, res, next) => {
  try {
    const socialLinks = await SocialLinks.list(req.user.id);
    return res.json({ socialLinks });
  } catch (error) {
    return next(error);
  }
};

export const createSocialLink = async (req, res, next) => {
  try {
    const validated = await validateSocialLink(req.body);
    const socialLink = await SocialLinks.create(req.user.id, validated);
    return res.status(201).json({ socialLink });
  } catch (error) {
    return next(error);
  }
};

export const updateSocialLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateSocialLink(req.body);
    const socialLink = await SocialLinks.update(req.user.id, id, validated);
    if (!socialLink) {
      res.status(404);
      throw new Error("Social link not found.");
    }
    return res.json({ socialLink });
  } catch (error) {
    return next(error);
  }
};

export const deleteSocialLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SocialLinks.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Social link not found.");
    }
    return res.json({ message: "Social link deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderSocialLinks = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await SocialLinks.reorder(req.user.id, order);
    return res.json({ message: "Social links reordered." });
  } catch (error) {
    return next(error);
  }
};

// ========== TESTIMONIALS ==========
export const listTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonials.list(req.user.id);
    return res.json({ testimonials });
  } catch (error) {
    return next(error);
  }
};

export const createTestimonial = async (req, res, next) => {
  try {
    const validated = await validateTestimonial(req.body);
    const testimonial = await Testimonials.create(req.user.id, validated);
    return res.status(201).json({ testimonial });
  } catch (error) {
    return next(error);
  }
};

export const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = await validateTestimonial(req.body);
    const testimonial = await Testimonials.update(req.user.id, id, validated);
    if (!testimonial) {
      res.status(404);
      throw new Error("Testimonial not found.");
    }
    return res.json({ testimonial });
  } catch (error) {
    return next(error);
  }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Testimonials.delete(req.user.id, id);
    if (!deleted) {
      res.status(404);
      throw new Error("Testimonial not found.");
    }
    return res.json({ message: "Testimonial deleted." });
  } catch (error) {
    return next(error);
  }
};

export const reorderTestimonials = async (req, res, next) => {
  try {
    const { order } = await validateReorder(req.body);
    await Testimonials.reorder(req.user.id, order);
    return res.json({ message: "Testimonials reordered." });
  } catch (error) {
    return next(error);
  }
};
