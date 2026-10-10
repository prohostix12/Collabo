
# -*- coding: utf-8 -*-
import os

file_path = 'frontend/src/components/Profile/CompanyProfile.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements map
replacements = {
    "icon: 'ðŸ‘—'": "icon: '👗'",
    "icon: 'ðŸ’„'": "icon: '💄'",
    "icon: 'ðŸ’»'": "icon: '💻'",
    "icon: 'ðŸ •'": "icon: '🍕'",
    "icon: 'ðŸ’ª'": "icon: '💪'",
    "icon: 'âœˆï¸ '": "icon: '✈️'",
    "icon: 'ðŸš—'": "icon: '🚗'",
    "icon: 'ðŸ’°'": "icon: '💰'",
    "icon: 'ðŸŽ¬'": "icon: '🎬'",
    "icon: 'ðŸ“š'": "icon: '📚'",
    
    # Company Sizes
    "icon: 'ðŸ‘¥'": "icon: '👥'",
    "icon: 'ðŸ‘¨â€ ðŸ‘©â€ ðŸ‘§â€ ðŸ‘¦'": "icon: '🏢'",
    "icon: 'ðŸ ¢'": "icon: '🏭'",
    "icon: 'ðŸ ¬'": "icon: '🏙️'",
    "icon: 'ðŸ ­'": "icon: '🌆'",
    
    # Defaults (some might overlap)
    "icon: 'ðŸ ¢'": "icon: '🏢'", # Default industry icon
}

new_content = content
for old, new in replacements.items():
    new_content = new_content.replace(old, new)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully patched CompanyProfile.js")
else:
    print("No changes made. Mojibake strings not found.")
    # Debug: print a snippet to see what's actually there
    start = content.find("const industries = [")
    if start != -1:
        print("Snippet from file:")
        print(content[start:start+500])

