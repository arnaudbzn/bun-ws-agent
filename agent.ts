import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const chatHistory: Array<ChatCompletionMessageParam> = [];

const openai = new OpenAI({
  apiKey: "sk-<your key here>",
  baseURL: "http://localhost:1234/v1",
});

const PROMPT = `You are a participant in an internet chatroom.
You are a friendly assistant that helps people with their problems.
Keep your responses short.
`;

const AGENT_NAME = "AI";

const socket = new WebSocket("ws://localhost:8000/ws");

const client =
  // message is received
  socket.addEventListener("message", async (event) => {
    const message = JSON.parse(event.data as string) as {
      from: string;
      content: string;
    };

    console.log("Message from server ", message);

    // Skip messages from the agent
    if (message.from === AGENT_NAME) {
      return;
    }

    const contentWithUser = `${message.from}: ${message.content}`;
    chatHistory.push({ role: "user", content: contentWithUser });

    const response = await openai.chat.completions.create({
      messages: chatHistory,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    const aiContent = response.choices[0].message.content;

    chatHistory.push({
      role: "assistant",
      content: aiContent,
    });

    // Send the AI response back to the WebSocket server
    const aiResponse = { from: AGENT_NAME, content: aiContent };
    socket.send(JSON.stringify(aiResponse));
  });

// socket opened
socket.addEventListener("open", (event) => {
  console.log("Socket opened");
});

// socket closed
socket.addEventListener("close", (event) => {
  console.log("Socket closed");
});

// error handler
socket.addEventListener("error", (event) => {
  console.error("WebSocket error observed:", event);
});
