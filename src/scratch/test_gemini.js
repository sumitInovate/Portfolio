import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testProfile() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  try {
    const result = await model.generateContent("Say hello");
    console.log("Profile Model OK: ", result.response.text());
  } catch(e) {
    console.error("Profile Model Error: ", e);
  }
}

async function testAvatar() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
  try {
    const result = await model.generateContent("A cute cat");
    console.log("Avatar Model OK, got response parts:", result.response.candidates[0].content.parts);
  } catch(e) {
    console.error("Avatar Model Error: ", e);
  }
}

async function main() {
  await testProfile();
  await testAvatar();
}

main();
