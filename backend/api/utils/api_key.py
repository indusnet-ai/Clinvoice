import uuid
import hashlib

#def generate_api_key():
    #unique_id = uuid.uuid4()

    #hashed_key = hashlib.sha256(str(unique_id).encode()).hexdigest()
    #return hashed_key



def generate_api_key(user_name,user_email):
    
    # Generate a unique UUID
    unique_id = uuid.uuid4()
    # Combine the user's email and the UUID.  This is crucial for ensuring uniqueness
    # per user.
    key_string = f"{user_name}_{user_email}_{unique_id}"
    # Hash the combined string using SHA256.
    hashed_key = f"sk_{hashlib.sha256(key_string.encode()).hexdigest()}"
    return hashed_key

#key = generate_api_keyy("admin","admin@clinvoice.com")
#print(key)