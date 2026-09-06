import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using Ethereal fake SMTP service
export const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER || 'darlene.stark@ethereal.email',
    pass: process.env.ETHEREAL_PASS || 'XzY1Z3ZqJv8J2QGk2r',
  },
});

export const getEtherealTransporter = async () => {
  // If we want to generate a new account on the fly:
  // let testAccount = await nodemailer.createTestAccount();
  return transporter;
}
