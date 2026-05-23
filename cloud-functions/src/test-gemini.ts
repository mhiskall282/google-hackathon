import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your-gemini')) {
  console.error('❌ Missing or invalid GEMINI_API_KEY in environment.');
  process.exit(1);
}

console.log('📡 Initializing Gemini Generative AI client...');
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGemini() {
  console.log('🔍 Querying gemini-1.5-flash model...');
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const response = await model.generateContent('Say: "Gemini connection is functional!" and summarize what a disaster responder needs in one short sentence.');
  
  console.log('✅ Response Received from Google Gemini:');
  console.log(response.response.text().trim());
}

testGemini().catch((err) => {
  console.error('❌ Gemini Connection Failed:', err.message);
  process.exit(1);
});
