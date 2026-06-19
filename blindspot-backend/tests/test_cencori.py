"""Quick standalone test — run: python test_cencori.py"""
import os
from dotenv import load_dotenv
load_dotenv()

from cencori import Cencori

api_key = os.getenv("CENCORI_API_KEY")
print(f"API key present: {bool(api_key)}")

client = Cencori(api_key=api_key)

print("Testing non-streaming call...")
try:
    response = client.ai.chat(
        model="gemini-2.5-flash",
        messages=[{"role": "user", "content": "Say hello in one word."}],
    )
    print(f"chat() response: {response!r}")
except Exception as e:
    print(f"chat() error: {type(e).__name__}: {e}")

print("\nTesting streaming call...")
try:
    stream = client.ai.chat_stream(
        model="gemini-2.5-flash",
        messages=[{"role": "user", "content": "Count to 3."}],
    )
    chunks = []
    for chunk in stream:
        print(f"  chunk: {chunk!r}")
        chunks.append(chunk)
        if len(chunks) > 5:
            print("  (stopping early)")
            break
    print(f"Total chunks seen: {len(chunks)}")
except Exception as e:
    print(f"chat_stream() error: {type(e).__name__}: {e}")
