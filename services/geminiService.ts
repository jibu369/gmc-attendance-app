
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAttendanceAdvice = async (courseName: string, attendancePercentage: number): Promise<string> => {
  const prompt = `
    I am a university student in the course "${courseName}". My current attendance is only ${attendancePercentage}%.
    Please provide some encouraging and actionable advice on how to improve my attendance, get motivated, and catch up with my studies.
    Keep the tone supportive and positive. Structure the response in clear, easy-to-digest points.
    Do not greet me or sign off, just provide the advice.
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 1
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting attendance advice from Gemini:", error);
    return "Sorry, I couldn't generate advice at this moment. Please check your connection and API key setup.";
  }
};


export const generateTeacherSummary = async (courseName: string, studentAttendance: { name: string, percentage: number }[]): Promise<string> => {
  const attendanceData = studentAttendance.map(s => `${s.name}: ${s.percentage}%`).join('\n');
  const prompt = `
    You are an assistant for a university professor.
    Analyze the following attendance data for the course "${courseName}" and provide a brief summary.
    Highlight any students who are at risk (below 75% attendance) and suggest a brief, positive note for students with high attendance.
    
    Attendance Data:
    ${attendanceData}
    
    Keep the summary concise and professional.
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
       config: {
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating teacher summary from Gemini:", error);
    return "Sorry, I couldn't generate a summary at this moment. Please try again later.";
  }
};

export const generateClassReminder = async (): Promise<string> => {
    const prompt = `
    Generate a short, positive, and general-purpose reminder message for university students.
    It should encourage them to stay on top of their studies and check their attendance.
    The tone should be motivational and supportive. Address the students collectively.
    Example: "Hey everyone! Just a friendly reminder to check your attendance and keep up the great work in your courses. Your dedication is paying off!"
    Keep it to one or two sentences.
    `;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.8,
            }
        });
        return response.text.replace(/"/g, ''); // Remove quotes from the response
    } catch (error) {
        console.error("Error generating class reminder from Gemini:", error);
        return "Couldn't generate a reminder right now. Please try again.";
    }
};