from backend.resume_analyzer_backend.checks.ats_checks import analyze_experience
import requests  
url_for_model = "http://127.0.0.1:1234/v1/chat/completions" 

JSON_SCHEMA = """
{
  "overall_score": 0,
  "summary": {
    "headline": "",
    "overview": ""
  },
  "strengths": [
    ""
  ],
  "weaknesses": [
    ""
  ],
  "priority_improvements": [
    {
      "title": "",
      "reason": "",
      "impact": "High | Medium | Low"
    }
  ],
  "ats": {
    "score": 0,
    "summary": "",
    "passed_checks": [],
    "failed_checks": []
  },
  "experience": {
    "score": 0,
    "summary": "",
    "strengths": [],
    "improvements": []
  },
  "projects": {
    "score": 0,
    "summary": "",
    "strengths": [],
    "improvements": []
  },
  "skills": {
    "score": 0,
    "summary": "",
    "strengths": [],
    "missing_skills": []
  },
  "education": {
    "score": 0,
    "summary": ""
  },
  "links": {
    "linkedin": {
      "present": true,
      "feedback": ""
    },
    "github": {
      "present": true,
      "feedback": ""
    },
    "portfolio": {
      "present": false,
      "feedback": ""
    }
  },
  "final_recommendation": {
    "ready_for_applications": false,
    "confidence": 0,
    "next_steps": [
      ""
    ]
  }
}
"""
def analyze_resume(link):
    links,markdown,analysis_json=analyze_experience(link)

   
    payload={"messages" :[
    {
    "role": "system",
    "content": f"""
You are an expert ATS Resume Reviewer and Career Coach.

You will receive:
1. Resume markdown.
2. Extracted links.
3. Structured resume analysis.

Rules:
- Trust the structured analysis.
- Use the markdown only as supporting context.
- Do not invent information.
- Return ONLY valid JSON.
- No markdown.
- No explanations.

Resume Markdown:
{markdown}

Links:
{links}

Analysis:
{analysis_json}

Return JSON in exactly this format:

{JSON_SCHEMA}
"""
},
    {
        "role": "user",
        "content": "Analyze this resume "
    }
],
        "temperature":0.5,
       
        
    }

    response=requests.post(url_for_model,json=payload)
    import json

    data = response.json()   
        
    content = data["choices"][0]["message"]["content"]

    analysis = json.loads(content)

    return {
        "success": True,
        "analysis": analysis
    }
    

