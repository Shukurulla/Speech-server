export const createWarning = (user, res) => {
  if (user.role == "user") {
    return res.status(400).json({
      status: "error",
      message: "Bu malumotni faqat admin qosha oladi",
    });
  }
};
export const deleteWarning = (user, res) => {
  if (user.role == "user") {
    return res.status(400).json({
      status: "error",
      message: "Bu malumotni faqat admin ochira oladi",
    });
  }
};

export const allFieldError = (res) => {
  res.status(400).json({
    status: "error",
    message: "Iltimos barcha maydonlarni toliq kiriting",
  });
};

export const dataNotFound = (res) => {
  res
    .status(400)
    .json({ status: "error", message: "Bunday malumot topilmadi" });
};

export const successData = (res, data) => {
  res.status(200).json({ status: "success", data: data });
};

export const successDeleteData = (res) => {
  res
    .status(200)
    .json({ status: "success", message: "Malumot muaffaqiyatli ochirildi" });
};

export const catchError = (res, error) => {
  res.status(500).json({ status: "error", message: error.message });
};
