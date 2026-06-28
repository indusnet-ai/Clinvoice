import os, shutil
import logging
import asyncio

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def remove_directory():
#if os.path.isdir("uploaded_audio"):
    #os.rmdir("uploaded_audio")     # for empty folder

    if os.path.isdir("uploaded_audio"):
        # Run the potentially blocking file operation in a separate thread
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: shutil.rmtree("uploaded_audio"))
        logger.info("Temporary storage removed successfully")
        return True
    return False
