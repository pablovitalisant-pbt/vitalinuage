from sqlalchemy.orm import Session
from backend import models
from backend import schemas
from backend import auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    try:
        print(f"[CRUD] Starting user creation for: {user.email}")
        # LEGACY AUTH REMOVAL: We no longer hash passwords.
        # Firebase handles auth. hashed_password is set to None.
        
        db_user = models.User(
            email=user.email, 
            hashed_password=None, 
            is_verified=False, # Will be updated by Sync logic in dependencies
            professional_name=getattr(user, 'professional_name', "Doctor")
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"[CRUD] User creation complete: ID={db_user.id}")
        
        return db_user
    except Exception as e:
        print(f"[CRUD] ERROR in create_user: {type(e).__name__}: {str(e)}")
        db.rollback()
        raise

def create_patient(db: Session, patient: schemas.PatientCreate, owner_id: str):
    # Enforce owner_id from argument (from token), ignoring payload owner_id if any mismatch
    patient_data = patient.model_dump()
    patient_data['owner_id'] = owner_id # Override/Ensure
    
    db_patient = models.Patient(**patient_data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_patients(db: Session, owner_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).filter(models.Patient.owner_id == owner_id).offset(skip).limit(limit).all()

