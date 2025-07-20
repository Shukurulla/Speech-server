import express from "express";
import testDetailModel from "../models/test.detail.model.js";
import testModel from "../models/test.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  allFieldError,
  catchError,
  dataNotFound,
  successData,
  successDeleteData,
} from "../utils/responses.js";

const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { parentId, text, condition } = req.body;
    if (!parentId || !text || !condition) {
      return allFieldError(res);
    }

    const findTest = await testModel.findById(parentId);
    if (!findTest) {
      return dataNotFound(res);
    }

    const testDetail = await testDetailModel.create(req.body);
    successData(res, testDetail);
  } catch (error) {
    catchError(res, error);
  }
});

router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const findTestDetail = await testDetailModel.findById(req.params.id);
    if (!findTestDetail) {
      return dataNotFound(res);
    }
    const updateTestDetail = await testDetailModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );
    successData(res, updateTestDetail);
  } catch (error) {
    catchError(res, error);
  }
});
router.put("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const findTestDetail = await testDetailModel.findById(req.params.id);
    if (!findTestDetail) {
      return dataNotFound(res);
    }
    const updateTestDetail = await testDetailModel.findByIdAndDelete(
      req.params.id
    );
    successDeleteData(res);
  } catch (error) {
    catchError(res, error);
  }
});

export default router;
