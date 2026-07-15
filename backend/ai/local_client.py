import requests
import json 
LM_STUDIO_URL ="http://127.0.0.1:1234/v1/chat/completions"

def local_client(
    user_prompt: str,
    system_prompt: str,
    temperature: float = 0.5,
    
):
    payload = {
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": temperature,
        
    }

    response = requests.post(
        LM_STUDIO_URL,
        json=payload,
        timeout=120,
    )
    print(response.text)
    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]

    return content

