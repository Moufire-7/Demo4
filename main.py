from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv 

load_dotenv()

app = Flask(__name__)
CORS(app)

# Azure OpenAI Client
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

def search_documents(query, index_name):
    headers = {
        "Content-Type": "application/json",
        "api-key": os.getenv("AZURE_SEARCH_KEY")
    }
    search_url = f"{os.getenv('AZURE_SEARCH_ENDPOINT')}/indexes/{index_name}/docs/search?api-version=2023-07-01-Preview"

    search_body = {
        "search": query,
        "top": 5
    }

    response = requests.post(search_url, headers=headers, json=search_body)
    results = response.json()

    docs = []
    for doc in results.get("value", []):
        if index_name == "documents-index":
            docs.append(doc.get("content", ""))
        elif index_name == "ivanti-index":
            parts = [
                doc.get("Subject", ""),
                doc.get("Symptom", ""),
                doc.get("Resolution", "")
            ]
            combined = "\n".join([p for p in parts if p])
            docs.append(combined)
        else:
            docs.append("")
    return docs

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    user_query = data.get('query', '').strip()
    
    if not user_query:
        return jsonify({"error": "Empty query"}), 400

    all_docs = []
    for idx in ["ivanti-index"]:
        all_docs.extend(search_documents(user_query, idx))

    if all_docs:
        answer = ask_gpt(user_query, all_docs)
        return jsonify({"answer": answer})
    else:
        return jsonify({"answer": "No relevant documents found."})

def ask_gpt(query, docs):
    context = "\n\n".join(docs)
    prompt = f"You are an expert assistant. Use the below knowledge to answer the question:\n\n{context}\n\nQuestion: {query}"

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=700
    )

    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    app.run(port=5000)