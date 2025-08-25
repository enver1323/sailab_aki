from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.domain.user.entities.user import User
from app.core.exceptions import InsufficientRightsError

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            
            user_id = get_jwt_identity()
            user = User.find_by_id(user_id)

            if user is None or not user.is_admin:
                raise InsufficientRightsError()
            
            return fn(*args, **kwargs)

        return decorator

    return wrapper