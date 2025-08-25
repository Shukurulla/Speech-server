import Vocabulary from "../models/Vocabulary.js";

// Create vocabulary
export const createVocabulary = async (req, res) => {
  try {
    const vocabularyData = req.body;
    const vocabulary = new Vocabulary(vocabularyData);
    await vocabulary.save();

    res.status(201).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get vocabulary by lesson
export const getVocabularyByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const vocabulary = await Vocabulary.find({
      lessonId,
      isActive: true,
    }).sort("order");

    res.status(200).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get vocabulary by grade
export const getVocabularyByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const vocabulary = await Vocabulary.find({
      gradeId,
      isActive: true,
    })
      .populate("lessonId", "title orderNumber")
      .sort("lessonId order");

    res.status(200).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get vocabulary by ID
export const getVocabularyById = async (req, res) => {
  try {
    const { id } = req.params;

    const vocabulary = await Vocabulary.findById(id);

    if (!vocabulary) {
      return res.status(404).json({
        status: "error",
        message: "Vocabulary not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update vocabulary
export const updateVocabulary = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const vocabulary = await Vocabulary.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!vocabulary) {
      return res.status(404).json({
        status: "error",
        message: "Vocabulary not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete vocabulary
export const deleteVocabulary = async (req, res) => {
  try {
    const { id } = req.params;

    const vocabulary = await Vocabulary.findByIdAndDelete(id);

    if (!vocabulary) {
      return res.status(404).json({
        status: "error",
        message: "Vocabulary not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Vocabulary deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Search vocabulary
export const searchVocabulary = async (req, res) => {
  try {
    const { q, gradeId, lessonId } = req.query;

    const query = { isActive: true };

    if (q) {
      query.$or = [
        { word: { $regex: q, $options: "i" } },
        { definition: { $regex: q, $options: "i" } },
      ];
    }

    if (gradeId) query.gradeId = gradeId;
    if (lessonId) query.lessonId = lessonId;

    const vocabulary = await Vocabulary.find(query)
      .populate("lessonId", "title")
      .limit(50);

    res.status(200).json({
      status: "success",
      data: vocabulary,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
