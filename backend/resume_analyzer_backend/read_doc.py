from collections import defaultdict
import fitz
import pymupdf4llm
import re

def get_text_and_links(pdf_path):
    Links = defaultdict(list)

    doc = fitz.open(pdf_path)
    markdown = pymupdf4llm.to_markdown(pdf_path)

    labels = []

    for line in markdown.splitlines():
        labels.extend(re.findall(r"<u>(.*?)</u>", line))

    counter = 0

    for page in doc:
        for link in page.get_links():
            if "uri" in link and counter < len(labels):
                Links[labels[counter]].append(link["uri"])
                counter += 1

    doc.close()

    return dict(Links), markdown