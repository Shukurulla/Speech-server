import express from "express";
import testModel from "../models/test.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  allFieldError,
  catchError,
  createWarning,
  dataNotFound,
  successData,
  successDeleteData,
} from "../utils/responses.js";
import testCategoryModel from "../models/test.category.model.js";
import User from "../models/user.model.js";
import testDetailModel from "../models/test.detail.model.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const allTests = await testModel.find();
    const fullDataTests = allTests.map((item) => {
      return {
        _id: item._id,
        title: item.title,
        category: item.category,
        difficulty: item.difficulty,
        gradeId: item.gradeId,
        lessonId: item.lessonId,
        type: item.type,
      };
    });

    res.status(200).json({ status: "success", data: fullDataTests });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const findTest = await testModel.findById(id);
    const testItems = await testDetailModel.find({ parentId: id });
    if (!findTest) {
      return dataNotFound(res);
    }
    const data = {
      title: findTest.title,
      category: findTest.category,
      testItems: testItems,
    };

    successData(res, data);
  } catch (error) {
    catchError(res._construct, error);
  }
});

router.post("/create", authMiddleware, async (req, res) => {
  try {
    await createWarning(req.userData, res);
    const { title, categoryId, difficulty, gradeId, lessonId, type } = req.body;
    const findCategory = await testCategoryModel.findById(categoryId);
    if (!title) {
      return allFieldError(res);
    }
    if (!findCategory) {
      return dataNotFound(res);
    }
    const test = await testModel.create({
      title,
      category: findCategory,
      difficulty,
      gradeId,
      lessonId,
      type,
    });

    successData(res, test);
  } catch (error) {
    catchError(res, error);
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    await createWarning(req.userData, res);
    const { id } = req.params;
    const findTest = await testModel.findById(id);
    if (!findTest) {
      return dataNotFound(res);
    }

    const { title, categoryId } = req.body;
    const findCategory = await testCategoryModel.findById(categoryId);
    if (!title) {
      return allFieldError(res);
    }
    if (!findCategory) {
      return dataNotFound(res);
    }

    const updatedTest = await testModel.findByIdAndUpdate(id, {
      title,
      category: findCategory,
    });
    successData(res, updatedTest);
  } catch (error) {
    catchError(res, error);
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await createWarning(req.userData, res);
    const { id } = req.params;
    const findTest = await testModel.findById(id);
    if (!findTest) {
      return dataNotFound(res);
    }

    await testModel.findByIdAndDelete(id);
    successDeleteData(res);
  } catch (error) {
    catchError(res, error);
  }
});

router.post("/complate-test/:id", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.userData;
    if (role == "admin") {
      return res.status(400).json({
        status: "error",
        message: "Test topshiriqlar faqat Studentlar uchun!!",
      });
    }
    const { id } = req.params;
    const findTest = await testModel.findById(id);
    if (!findTest) {
      return dataNotFound(res);
    }
    const findUser = await User.findById(userId);
    if (!findUser) {
      return dataNotFound(res);
    }
    const { score } = req.body;
    if (!score) {
      return res.status(400).json({
        status: "error",
        message: "Test natijasini kiritishingiz kerak",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          complateTests: [...findUser.complateTests, { testId: id, score }],
        },
      },
      { new: true }
    );

    successData(res, updatedUser);
  } catch (error) {
    catchError(res, error);
  }
});

export default router;
