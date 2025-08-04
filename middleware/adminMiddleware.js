export const adminOnly = (req, res, next) => {
  if (req.userData.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};
