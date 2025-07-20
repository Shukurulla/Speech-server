import express from "express";
import testCategoryModel from "../models/test.category.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createWarning,
  dataNotFound,
  deleteWarning,
} from "../utils/responses.js";

const router = express.Router();

router.get("/list", authMiddleware, async (req, res) => {
  try {
    const categries = await testCategoryModel.find();
    res.status(200).json({ status: "success", data: categries });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const categries = await testCategoryModel.findById(req.params.id);
    res.status(200).json({ status: "success", data: categries });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { role } = req.userData;
    if (role == "user") {
      return res.status(200).json({
        status: "error",
        message: "Kategoriyalarni faqat admin qoshishi mumkin",
      });
    }
    const { title } = req.body;
    if (!title || title.length == 0) {
      res.json({
        status: "error",
        message: "Barcha maydonlarni toliq kiriting",
      });
    }

    const category = await testCategoryModel.create(req.body);

    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    await createWarning(req.userData, res);
    const { title } = req.body;
    const { id } = req.params;
    if (!title || title.length == 0) {
      res.json({
        status: "error",
        message: "Barcha maydonlarni toliq kiriting",
      });
    }

    const findCategory = await testCategoryModel.findById(id);
    if (!findCategory) {
      return dataNotFound(res);
    }

    const updateCategory = await testCategoryModel.findByIdAndUpdate(id, {
      title,
    });
    res.status(200).json({ status: "success", data: updateCategory });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deleteWarning(req.userData, res);

    const { id } = req.params;

    const findCategory = await testCategoryModel.findById(id);
    if (!findCategory) {
      return dataNotFound(res);
    }

    await testCategoryModel.findByIdAndDelete(id);
    res.status(200).json({
      status: "success",
      message: "Kategoriya muaffaqiyatli ochirildi",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
