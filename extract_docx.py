
import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = "kitsu_tasklist.docx"

if not os.path.exists(docx_path):
    print(f"Error: {docx_path} not found.")
    exit(1)

try:
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read("word/document.xml")
        root = ET.fromstring(xml_content)
        
        # XML namespace for Word
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text_content = []
        for p in root.findall('.//w:p', namespace):
            paragraph_text = []
            for t in p.findall('.//w:t', namespace):
                if t.text:
                    paragraph_text.append(t.text)
            if paragraph_text:
                text_content.append("".join(paragraph_text))
        
        print("\n".join(text_content))

except Exception as e:
    print(f"Error Extracting Docx: {e}")
