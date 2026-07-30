
import fitz
import pymupdf4llm
import re

def get_text_and_links(pdf_path):
    
    

    doc = fitz.open(pdf_path)
    markdown = pymupdf4llm.to_markdown(pdf_path)

    labels = []

    for line in markdown.splitlines():
        labels.extend(re.findall(r"<u>(.*?)</u>", line))



    doc.close()

    return  markdown




def markdown_to_json(markdown_text):
    root = {}
    stack = [(0, root)]

    heading_pattern = re.compile(r"^(#+)\s*(.*)$")

    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        heading_match = heading_pattern.match(line)

        if heading_match:
            hashes = heading_match.group(1)
            heading = heading_match.group(2)

            level = len(hashes)

            heading = heading.replace("**", "").strip()

            
            while stack[-1][0] >= level:
                stack.pop()

            parent_dict = stack[-1][1]

            new_section = {
                "content": []
            }

            parent_dict[heading] = new_section
            stack.append((level, new_section))

        else:
            current_section = stack[-1][1]

            if "content" not in current_section:
                current_section["content"] = []

            current_section["content"].append(line)

   
    clean_content(root)

    return root

def clean_content(obj):
    if not isinstance(obj, dict):
        return

    for key, value in list(obj.items()):
        if key == "content":
            if isinstance(value, list):
                cleaned_lines = [
                    line for line in value
                    if isinstance(line, str) and line.strip()
                ]

                if cleaned_lines:
                    obj[key] = "\n".join(cleaned_lines)
                else:
                    del obj[key]

        elif isinstance(value, dict):
            clean_content(value)




def return_santized_structured_json(pdf_path):
    markdown=get_text_and_links(pdf_path)
    phone_pattern = r"\+91[\s-]*[6-9]\d{9}"
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    markdown = re.sub(phone_pattern, "<PHONE>", markdown)
    markdown=re.sub(email_pattern,"<EMAIL>",markdown)
    extracted_text=markdown_to_json(markdown)
    return extracted_text
