from datetime import datetime
import uuid

def generate_transcript_id():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return  f"transcript_{timestamp}_{uuid.uuid4().hex[:6]}"

#print(generate_conversation_id())

#print(uuid.uuid4().hex[:6])