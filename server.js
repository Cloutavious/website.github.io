const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post("/api/generate", async (req, res) => {
  const { school, grade, subject, topic, format, notes_pages, papers_pages, email } = req.body;

  const prompt = `
You are an educational assistant.

A student from ${school}, Grade ${grade}, has requested help with:
- Subject: ${subject}
- Topic: ${topic}
- Question format: ${format}
- Number of pages: ${notes_pages} for notes, ${papers_pages} for questions.

Please:
1. Generate clear, well-structured study notes (suitable for Grade ${grade}) in about ${notes_pages} pages.
2. Generate ${papers_pages} pages of questions in the formats specified.

Make it concise, helpful, and student-friendly.
`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.content[0].text;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: `${email}, stapiso09@gmail.com`,
      subject: `Generated Notes & Questions: ${subject} - ${topic}`,
      text: content,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
