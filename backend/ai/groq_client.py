from groq import Groq
import os 
import json 
from dotenv import load_dotenv
load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

def groq_client(   
    system_prompt: str,
    user_prompt: str,
    model_name='llama-3.3-70b-versatile',
    temperature: float = 0.5
    ):
    chat_completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=temperature,
            
        )

    output=chat_completion.choices[0].message.content
    try:
        # response = json.loads(output)
        return output 
    
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Model returned invalid JSON.",
            "raw_response": output,
        }

