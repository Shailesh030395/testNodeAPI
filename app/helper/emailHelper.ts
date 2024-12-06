import nodemailer from "nodemailer";
import envConfig from "../../envConfig";

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: envConfig.smtpHost,
  port: Number(envConfig.smtpPort),
  secure: false,
  auth: {
    user: envConfig.smtpEmailLogin,
    pass: envConfig.smtpPassword,
  },
});
// Send Email
const sendEmail = async (
  options: nodemailer.SendMailOptions
): Promise<boolean> => {
  try {
    await transporter.sendMail(options);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

export default sendEmail;
