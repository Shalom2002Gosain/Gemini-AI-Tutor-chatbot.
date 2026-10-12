import os
import uuid
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-secret-before-deploying")

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Add it to your .env file.")

llm = ChatGoogleGenerativeAI(
    # If this model name is unavailable for your Google AI account,
    # replace it with a Gemini model currently supported by your account.
    model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    google_api_key=api_key,
    temperature=0.7,
    max_output_tokens=1024,
)

SYSTEM_PROMPT = (
    "You are a helpful AI tutor. Give complete, clear answers in simple English. "
    "Use headings, bullet points, and code examples when useful. "
    "Do not stop in the middle of a sentence."
)

# Demo-only in-memory history. It resets when the server restarts.
# For a production app, store conversation history in a database or session store.
conversations = {}


def get_history():
    conversation_id = session.get("conversation_id")
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        session["conversation_id"] = conversation_id
    return conversations.setdefault(conversation_id, [])


def content_to_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts)
    return str(content)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    question = data.get("message", "").strip()

    if not question:
        return jsonify({"error": "Please type a message first."}), 400
    if len(question) > 10000:
        return jsonify({"error": "Message is too long. Please keep it under 10,000 characters."}), 400

    history = get_history()
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for item in history:
        if item["role"] == "user":
            messages.append(HumanMessage(content=item["content"]))
        else:
            messages.append(AIMessage(content=item["content"]))
    messages.append(HumanMessage(content=question))

    try:
        response = llm.invoke(messages)
        answer = content_to_text(response.content).strip()
        if not answer:
            answer = "I couldn't generate a text response. Please try asking another way."

        history.extend([
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer},
        ])
        return jsonify({
            "answer": answer,
            "finish_reason": response.response_metadata.get("finish_reason", "unknown"),
        })
    except Exception as exc:
        # Keep technical details in the server console, not exposed to the browser.
        app.logger.exception("Gemini request failed")
        return jsonify({
            "error": "The AI request failed. Check your API key, model name, internet connection, and server terminal."
        }), 502


@app.post("/api/clear")
def clear_chat():
    conversation_id = session.get("conversation_id")
    if conversation_id:
        conversations.pop(conversation_id, None)
    session["conversation_id"] = str(uuid.uuid4())
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True)
