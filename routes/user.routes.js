import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { generateToken } from "../utils/generateToken.js";
import { catchError } from "../utils/responses.js";

const router = express.Router();

router.post("/sign", async (req, res) => {
  try {
    const { firstname, lastname, password, role, email } = req.body;
    if (!firstname || !lastname || !password || !role || !email) {
      return res.status(400).json({
        status: "error",
        message: "Barcha maydonlar toldirilishi kerak",
      });
    }
    const findUser = await User.findOne({ email });

    if (findUser) {
      return res.status(400).json({
        status: "error",
        message: "Bunday foydalanuvchi oldin royhatdan otgan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ ...req.body, password: hashedPassword });

    const token = generateToken(user);

    res.status(200).json({
      status: "success",
      message: "Muaffaqiyatli ro'yhatdan otdingiz",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body;
    if (!password || !email) {
      return res.status(400).json({
        status: "error",
        message: "Barcha maydonlar toldirilishi kerak",
      });
    }
    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res.status(400).json({
        status: "error",
        message: "Bunday foydalanuvchi oldin royhatdan otmagan",
      });
    }

    const comparePassword = await bcrypt.compare(password, findUser.password);
    if (!comparePassword) {
      return res
        .status(400)
        .json({ status: "error", message: "Parol mos kelmadi" });
    }

    const token = generateToken(findUser);

    res.status(200).json({
      status: "success",
      message: "Muaffaqiyatli ro'yhatdan otdingiz",
      user: findUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.userData;
    const findUser = await User.findOne({ _id: userId, role });
    if (!findUser) {
      return res
        .status(400)
        .json({ status: "error", message: "Bunday foydalanuvchi topilmadi" });
    }
    res.status(200).json({ status: "success", user: findUser });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    const findUser = await User.findById(userId);
    if (!findUser) {
      return res
        .status(400)
        .json({ status: "error", message: "Bunday foydalanuvchi topilmadi" });
    }

    if (req.body.password) {
      return res.status(400).json({
        status: "error",
        message:
          "Password malumotlarini ozgartirish uchun boshqa usuldan foydalaning",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json({ status: "success", user: updatedUser });
  } catch (error) {
    catchError(res, error);
  }
});
router.put("/update-password", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    const findUser = await User.findById(userId);
    if (!findUser) {
      return res
        .status(400)
        .json({ status: "error", message: "Bunday foydalanuvchi topilmadi" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const compare = await bcrypt.compare(currentPassword, findUser.password);
    if (!compare) {
      return res
        .status(400)
        .json({ status: "error", message: "Password mos kelmadi" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Yangi password bilan tasdiqlash passwordi mos kelmadi",
      });
    }

    const hashNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: hashNewPassword,
      },
      { new: true }
    );
    res.status(200).json({ status: "success", user: updatedUser });
  } catch (error) {
    catchError(res, error);
  }
});

export default router;
