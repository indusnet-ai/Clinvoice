from datetime import datetime

def convert_unix_to_date(unix_timestamp: int) -> str:
    """
    Converts a Unix timestamp (integer) to a human-readable date string.
    
    Args:
        unix_timestamp: The Unix timestamp to convert.
        
    Returns:
        A formatted date string in "YYYY-MM-DD HH:MM:SS" format.
    """
    # Convert the integer timestamp to a datetime object
    date_time_object = datetime.fromtimestamp(unix_timestamp)
    
    # Format the datetime object into a human-readable string
    formatted_date_string = date_time_object.strftime("%Y-%m-%d %H:%M")
    
    return formatted_date_string