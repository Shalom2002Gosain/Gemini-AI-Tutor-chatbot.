# Nova Tutor — Gemini AI Tutor

A responsive HTML, CSS and JavaScript chat interface connected to your Gemini model through a small Flask backend.

## Project structure

```text
gemini_ai_tutor/
├── app.py
├── requirements.txt
├── .env.example
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Run on Windows

1. Open this folder in VS Code.
2. Create and activate a virtual environment:

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install packages:

   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to a new file named `.env`, then put your real Google API key in it. Never put your API key in HTML or JavaScript.

5. Start the app:

   ```powershell
   python app.py
   ```

6. Open the local address printed by Flask, normally `http://127.0.0.1:5000`.

## Important notes

- The backend uses your existing LangChain `ChatGoogleGenerativeAI` approach.
- If `gemini-3.8-flash` is not available to your API key, set `GEMINI_MODEL` in `.env` to a Gemini model currently available to your account.
- Conversation history is kept in memory for this demo and disappears when the server restarts.
- Do not deploy Flask's debug server publicly. Before deployment, configure a strong secret key, add rate limiting and authentication as needed, and use a production WSGI server.
