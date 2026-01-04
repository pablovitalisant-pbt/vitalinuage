from sqlalchemy.orm import Session
import backend.models as models
import backend.schemas as schemas
import backend.auth as auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
    db.refresh(db_user)
    return db_user

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
