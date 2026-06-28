import re
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def extract_ultimate_robust(llm_response: str) -> List[Dict[str, Any]]:
    """
    Final attempt to extract JSON blocks by aggressively cleaning the input
    and using a regex that matches any text between three backticks, 
    regardless of language identifier or extra space/newlines.
    """
    logger.info("Extracting JSON from LLM response.")
    # 1. Aggressive cleaning to remove non-standard spaces/newlines/hidden characters
    cleaned_response = (
        llm_response.replace('\u00a0', ' ')
        .replace('\r', '')
        .replace('\u200b', '') # Removes zero-width space
        .strip()
    )
    
    # 2. Most forgiving Regular Expression: Finds ANY content between ``` and ```
    # Pattern: Finds ```, captures everything (.*?) until it hits another ```
    # The inner logic then attempts to parse the captured content as JSON.
    json_blocks = re.findall(r'```(.*?)```', cleaned_response, re.DOTALL)
    
    if not json_blocks:
        logger.warning("No JSON blocks found in LLM response.")
        return []

    logger.info(f"Successfully extracted {len(json_blocks)} JSON blocks.")
    parsed_jsons = []
    
    # 3. Iterate, attempt to clean, and parse
    for block_str in json_blocks:
        # Since the block might contain the "json\n" header, we strip non-brace characters
        pure_json_str = block_str.strip()
        
        # Heuristic check: If the first line is just "json", remove it.
        if pure_json_str.lower().startswith('json'):
            pure_json_str = pure_json_str[4:].strip()
            
        try:
            # Must start with a brace or bracket for json.loads()
            if pure_json_str.startswith('{') or pure_json_str.startswith('['):
                data = json.loads(pure_json_str)
                
                if isinstance(data, list):
                    parsed_jsons.extend(data)
                elif isinstance(data, dict):
                    parsed_jsons.append(data)
                        
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse a JSON block. Error: {e}")
            
    logger.info(f"Successfully parsed {len(parsed_jsons)} JSONs.")
    return parsed_jsons

