import requests
url_for_model = "http://127.0.0.1:1234/v1/chat/completions" 

def get_summary(user_context):
    payload={"messages":[{
                "role":"system",
                "content":f"""
    You are MentorAI's user memory extraction system.

    Your ONLY job is to create a short profile of the USER.

    Do NOT summarize the conversation.
    Do NOT summarize the assistant response.
    Do NOT create a learning roadmap.

    Extract only facts about the user.

    Priority order:
    1. User message
    2. Resume data
    3. Metrics data
    4. Previous summary

    The assistant response is only provided for context. Ignore all recommendations, examples, and advice from the assistant unless the user explicitly accepted or mentioned them.

    Rules:
    - Never convert advice into user skills.
    - Never say the user knows something unless it is explicitly stated.
    - Never create example projects.
    - Never create assumed weaknesses.
    - If data is missing, omit that section.

    Keep the output extremely concise (maximum 10 bullet points).

    Format:

    ## User Profile
    - Career goal:
    - Skills:
    - Experience:
    - Learning goals:
    - Preferences:
    - Progress:
    - Areas to improve:


    Previous Summary:
    {user_context["summary"]}

    USER MESSAGE:
    {user_context["conversation"]["user"]}
    METRICS:
    {user_context["metrics"]}

    RESUME:
    {user_context["resume"]}

    ASSISTANT RESPONSE (ignore unless user confirms):
    {user_context["conversation"]["assistant"]}

    Generate the updated user profile.
    """
            },{
                "role":"user",
                "content":f"{user_context}"
            }
        ],
        "temperature":0.7,
    }

    response=requests.post(url_for_model,json=payload)
    final=response.json()
    return final['choices'][0]['message']['content']
