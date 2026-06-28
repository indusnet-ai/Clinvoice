from passlib.context import CryptContext

pwd_cxt = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Hash:
    """Password hashing helpers.

    Calling convention used across the codebase is:
        Hash.bcrypt(plain_password)      -> str  (the hash)
        Hash.verify(stored_hash, plain)  -> bool
    """

    @staticmethod
    def bcrypt(password: str) -> str:
        return pwd_cxt.hash(password)

    @staticmethod
    def verify(hashed_password: str, plain_password: str) -> bool:
        # passlib expects (secret, hash) — swap before delegating.
        return pwd_cxt.verify(plain_password, hashed_password)
