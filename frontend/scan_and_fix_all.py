
import os
import ftfy

def fix_files_in_directory(directory):
    print(f"Scanning {directory}...")
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    fixed_content = ftfy.fix_text(content)
                    
                    # Manual overrides for specific things ftfy might miss or misinterpret in code context
                    # (Though ftfy is usually very good)
                    
                    if fixed_content != content:
                        print(f"Fixing {file_path}")
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(fixed_content)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    fix_files_in_directory('frontend/src')
