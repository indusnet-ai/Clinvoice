import asyncio
from sqlalchemy import select
from db.database import get_db_context
from db.models import User

async def main():
    async with get_db_context() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        if not users:
            print("No users registered yet.")
        for u in users:
            print(f"User: ID={u.id}, Name='{u.name}', Email='{u.email}'")

if __name__ == "__main__":
    try:
        # Check if get_db_context exists, otherwise get_db
        import db.database as db_mod
        if hasattr(db_mod, "get_db_context"):
            asyncio.run(main())
        else:
            # Fallback direct sessionmaker if context manager isn't present
            from db.database import async_session
            async def run_direct():
                async with async_session() as session:
                    result = await session.execute(select(User))
                    users = result.scalars().all()
                    for u in users:
                        print(f"User: ID={u.id}, Name='{u.name}', Email='{u.email}'")
            asyncio.run(run_direct())
    except Exception as e:
        print("Error:", e)
