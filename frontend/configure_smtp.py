"""
Interactive script to configure SMTP email settings
"""
import os
import re

def update_env_file():
    print("=" * 60)
    print("SMTP Email Configuration Setup")
    print("=" * 60)
    print()
    print("Before starting, make sure you have:")
    print("1. Enabled 2-Factor Authentication on your Gmail account")
    print("2. Generated an App Password from Google Account settings")
    print("   (https://myaccount.google.com/apppasswords)")
    print()
    
    # Get user input
    email = input("Enter your Gmail address: ").strip()
    
    # Validate email
    if not re.match(r'^[a-zA-Z0-9._%+-]+@gmail\.com$', email):
        print("\n❌ Please enter a valid Gmail address (e.g., yourname@gmail.com)")
        return
    
    print()
    print("Enter your Gmail App Password (16 characters, spaces will be removed)")
    print("Example: abcd efgh ijkl mnop")
    app_password = input("App Password: ").strip().replace(" ", "")
    
    if len(app_password) != 16:
        print("\n❌ App password should be 16 characters (without spaces)")
        return
    
    # Read current .env file
    env_path = os.path.join('backend', '.env')
    
    if not os.path.exists(env_path):
        print(f"\n❌ .env file not found at {env_path}")
        return
    
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update email settings
    updated_lines = []
    settings_updated = {
        'EMAIL_BACKEND': False,
        'EMAIL_HOST_USER': False,
        'EMAIL_HOST_PASSWORD': False,
        'DEFAULT_FROM_EMAIL': False
    }
    
    for line in lines:
        if line.startswith('EMAIL_BACKEND='):
            updated_lines.append('EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend\n')
            settings_updated['EMAIL_BACKEND'] = True
        elif line.startswith('EMAIL_HOST_USER='):
            updated_lines.append(f'EMAIL_HOST_USER={email}\n')
            settings_updated['EMAIL_HOST_USER'] = True
        elif line.startswith('EMAIL_HOST_PASSWORD='):
            updated_lines.append(f'EMAIL_HOST_PASSWORD={app_password}\n')
            settings_updated['EMAIL_HOST_PASSWORD'] = True
        elif line.startswith('DEFAULT_FROM_EMAIL='):
            updated_lines.append(f'DEFAULT_FROM_EMAIL={email}\n')
            settings_updated['DEFAULT_FROM_EMAIL'] = True
        else:
            updated_lines.append(line)
    
    # Write updated .env file
    with open(env_path, 'w') as f:
        f.writelines(updated_lines)
    
    print()
    print("=" * 60)
    print("✅ SMTP Configuration Updated Successfully!")
    print("=" * 60)
    print()
    print("Updated settings:")
    print(f"  EMAIL_BACKEND: smtp.EmailBackend")
    print(f"  EMAIL_HOST_USER: {email}")
    print(f"  EMAIL_HOST_PASSWORD: {'*' * 16}")
    print(f"  DEFAULT_FROM_EMAIL: {email}")
    print()
    print("Next steps:")
    print("1. Restart your Django server")
    print("2. Test by approving an influencer from Admin Dashboard")
    print("3. Check the recipient's email inbox")
    print()
    print("To test immediately, run:")
    print("  cd backend")
    print("  .venv\\Scripts\\activate")
    print("  python test_email_approval.py")
    print()

if __name__ == '__main__':
    try:
        update_env_file()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
