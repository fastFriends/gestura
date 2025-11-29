from passlib.context import CryptContext

# Create CryptContext for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Return hashed password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

hashed = get_password_hash("hello world")
print("Hashed:", hashed)

print("Match:", verify_password("hello world", hashed))
print("Wrong:", verify_password("abc123", hashed))