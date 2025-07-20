import jwt from "jsonwebtoken";

export const generateToken = (userData) => {
  const token = jwt.sign(
    { userId: userData._id, role: userData.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  return token;
};
