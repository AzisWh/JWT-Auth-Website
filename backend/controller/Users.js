import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({ attributes: ["id", "name", "email"] });
    res.json(users);
  } catch (error) {
    console.log(error);
  }
};

export const Register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) return res.status(400).json({ msg: "password tidak cocok" });
  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashPassword = await bcrypt.hash(password, salt);
    await Users.create({
      name: name,
      email: email,
      password: hashPassword,
    });
    res.json({ msg: "resigter berhasil" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "terjadi kesalahan saat mendaftar" });
  }
};

export const Login = async (req, res) => {
  try {
    //mencari user berdasarkan email
    const user = await Users.findAll({
      where: {
        email: req.body.email,
      },
    });
    if (!user) return res.status(404).json({ msg: "email tidak ditemukan", status: 404 });
    //membandingkan password
    const match = await bcrypt.compare(req.body.password, user[0].password);
    if (!match) return res.status(400).json({ msg: "password salah", status: 400 });
    const userId = user[0].id;
    const name = user[0].name;
    const email = user[0].email;
    // akses token
    const accessToken = jwt.sign({ userId, name, email }, `${process.env.ACCESS_TOKEN_SECRET}`, {
      expiresIn: "20s",
    });
    // refresh token
    const refreshToken = jwt.sign({ userId, name, email }, `${process.env.REFRESH_TOKEN_SECRET}`, {
      expiresIn: "1d",
    });
    //menyimpan refresh token ke database
    await Users.update(
      { refresh_token: refreshToken },
      {
        where: {
          id: userId,
        },
      }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken, status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "terjadi kesalahan saat login", error: error.message, status: 500 });
  }
};

export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204); //status no konten
  const user = await Users.findAll({
    where: {
      refresh_Token: refreshToken,
    },
  });
  if (!user[0]) return res.sendStatus(204); //if token database =! token client
  const userid = user[0].id;
  await Users.update(
    { refresh_token: null },
    {
      where: {
        id: userid,
      },
    }
  );
  res.clearCookie("refreshToken"); //menghapus cookie
  return res.sendStatus(200);
};
