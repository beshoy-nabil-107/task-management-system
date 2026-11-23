const milestoneModel = require("../models/milestoneModel");

async function getMilestones(request, response) {
  const milestones = await milestoneModel.findAll();

  return response.status(200).jsend.success({
    message: "Milestones retrieved successfully",
    data: {
      milestones,
    },
  });
}

async function getMilestoneById(request, response) {
  const milestoneId = Number(request.params.id);
  const milestone = await milestoneModel.findById(milestoneId);

  if (!milestone) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Milestone not found",
    });
  }

  return response.status(200).jsend.success({
    message: "Milestone retrieved successfully",
    data: {
      milestone,
    },
  });
}

async function createMilestone(request, response) {
  const { title, description, due_date } = request.body;

  const milestone = await milestoneModel.create({
    title,
    description: description || null,
    due_date: due_date || null,
    created_by: request.user.id,
  });

  return response.status(201).jsend.success({
    message: "Milestone created successfully",
    data: {
      milestone,
    },
  });
}

async function updateMilestone(request, response) {
  const milestoneId = Number(request.params.id);
  const { title, description, due_date } = request.body;

  const existingMilestone = await milestoneModel.findById(milestoneId);
  if (!existingMilestone) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Milestone not found",
    });
  }

  const updatedMilestone = await milestoneModel.update(milestoneId, {
    title,
    description,
    due_date: due_date === "" ? null : due_date,
  });

  return response.status(200).jsend.success({
    message: "Milestone updated successfully",
    data: {
      milestone: updatedMilestone,
    },
  });
}

async function deleteMilestone(request, response) {
  const milestoneId = Number(request.params.id);

  const existingMilestone = await milestoneModel.findById(milestoneId);
  if (!existingMilestone) {
    return response.status(404).jsend.error({
      code: 404,
      message: "Milestone not found",
    });
  }

  await milestoneModel.deleteById(milestoneId);

  return response.status(200).jsend.success({
    message: "Milestone deleted successfully",
    data: null,
  });
}

module.exports = {
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
