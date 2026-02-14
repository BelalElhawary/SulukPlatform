import httpx
import asyncio

async def check_ollama():
    url = "http://localhost:11434/api/tags"
    print(f"Checking {url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:100]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_ollama())
