# PRODUCTION: Update password to bcrypt standard
@app.get("/admin/migrate-to-bcrypt")
def migrate_to_bcrypt(db: Session = Depends(get_db)):
    """
    Migrate existing user from pbkdf2 to bcrypt.
    This endpoint updates the password hash to use bcrypt standard.
    """
    email = "pablovitalisant@gmail.com"
    new_password = "Vitali2026!"
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        return {"status": "ERROR", "message": f"User {email} not found"}
    
    # Generate NEW bcrypt hash
    new_hash = auth.get_password_hash(new_password)
    user.hashed_password = new_hash
    db.commit()
    
    print(f"[MIGRATION] User {email} migrated to bcrypt")
    print(f"[MIGRATION] New bcrypt hash: {new_hash[:30]}...")
    
    return {
        "status": "SUCCESS",
        "message": f"User {email} migrated to bcrypt successfully",
        "algorithm": "bcrypt",
        "password": new_password,
        "instructions": "You can now login at https://vitalinuage.web.app"
    }
