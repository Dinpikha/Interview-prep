from dataclasses import dataclass
from typing import Any
from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)


@dataclass
class GroqCompletionResult:
    content: str
    finish_reason: str | None = None
    usage: Any = None


def groq_client_with_metadata(
    system_prompt: str,
    user_prompt: str,
    model_name: str = "openai/gpt-oss-20b",
    temperature: float = 0.5,
    max_tokens: int | None = None,
) -> GroqCompletionResult:
    request_kwargs = {
        "model": model_name,
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
    if max_tokens is not None:
        request_kwargs["max_tokens"] = max_tokens

    chat_completion = client.chat.completions.create(**request_kwargs)
    choice = chat_completion.choices[0]
    return GroqCompletionResult(
        content=choice.message.content or "",
        finish_reason=getattr(choice, "finish_reason", None),
        usage=getattr(chat_completion, "usage", None),
    )


def groq_client(
    system_prompt: str,
    user_prompt: str,
    model_name: str = "openai/gpt-oss-20b",
    temperature: float = 0.5,
    max_tokens: int | None = None,
):
    result = groq_client_with_metadata(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_name=model_name,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return result.content


def groq_transcribe_audio(file_path: str):
    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
        )
    return transcription.text
