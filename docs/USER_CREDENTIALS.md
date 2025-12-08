# RPGCC AI Portal - Complete User Credentials List

**For Email Distribution - Week of December 2024**

---

## 🔐 Login Instructions

**Portal URL:** https://ai.torsor.co.uk

**Temporary Password:** `RPGCC2024!`  
⚠️ **All users must change their password on first login**

---

## 👥 Implementation Committee

| Name | Email | Committee | Team | Role | Password |
|------|-------|-----------|------|------|----------|
| **James Howard** | jhoward@rpgcc.co.uk | Implementation | BSG | Admin | *Custom* |
| **Laura Pond** | lpond@rpgcc.co.uk | Implementation | BSG | Member | RPGCC2024! |
| **Steve Johnson** | sjohnson@rpgcc.co.uk | Implementation | Audit | Member | RPGCC2024! |
| **Grace Bischoff** | gbischoff@rpgcc.co.uk | Implementation | Audit | Member | RPGCC2024! |
| **Tim Humphries** | thumphries@rpgcc.co.uk | Implementation | Tax | Member | RPGCC2024! |
| **Adam Thompson** | athompson@rpgcc.co.uk | Implementation | Tax | Member | RPGCC2024! |
| **James Palmer** | jpalmer@rpgcc.co.uk | Implementation | Corporate Finance | Member | RPGCC2024! |
| **Sam Stern** | sstern@rpgcc.co.uk | Implementation | Corporate Finance | Member | RPGCC2024! |
| **Katy Dunn** | kdunn@rpgcc.co.uk | Implementation | Bookkeeping | Member | RPGCC2024! |
| **Charlotte Stead** | cstead@rpgcc.co.uk | Implementation | Bookkeeping | Member | RPGCC2024! |
| **Nicola Sidoli** | nsidoli@rpgcc.co.uk | Implementation | Admin | Member | RPGCC2024! |

**Total: 11 members**

---

## 🛡️ Oversight Committee

| Name | Email | Committee | Role | Password |
|------|-------|-----------|------|----------|
| **James Howard** | jhoward@rpgcc.co.uk | Oversight | Admin/Chair | *Custom* |
| **Steve Johnson** | sjohnson@rpgcc.co.uk | Oversight | Member | RPGCC2024! |
| **Paul Randall** | prandall@rpgcc.co.uk | Oversight | Member | RPGCC2024! |
| **Kevin Foster** | kfoster@rpgcc.co.uk | Oversight | Member | RPGCC2024! |
| **Katie Dunn** | kdunn@rpgcc.co.uk | Oversight | Member | RPGCC2024! |

**Total: 5 members**

---

## 📧 Email Template

```
Subject: Welcome to the RPGCC AI Portal

Dear [Name],

You now have access to the RPGCC AI Portal, our secure platform for managing AI implementation initiatives across the firm.

LOGIN DETAILS:
Portal: https://ai.torsor.co.uk
Email: [email]
Password: RPGCC2024!

⚠️ IMPORTANT: You will be required to change your password on first login.

YOUR COMMITTEE: [Implementation/Oversight] Committee
YOUR ROLE: [Member/Chair/Admin]

WHAT YOU CAN DO:
[Implementation Committee]
- Submit AI opportunity identification forms
- Track ROI calculations for proposed solutions
- View analytics and project status
- Create post-implementation reviews

[Oversight Committee]
- Review high-value proposals (≥£5,000)
- Manage AI tool registry
- Review policies and governance documents
- Track security and compliance

If you have any questions or need assistance, please contact James Howard.

Best regards,
RPGCC AI Initiative Team
```

---

## ✅ User Creation Status

### Implementation Committee
- ✅ All 11 members created
- ✅ Profiles configured
- ✅ Teams assigned

### Oversight Committee
- ✅ James Howard (Admin)
- ✅ Steve Johnson
- ⏳ Paul Randall - **To be created**
- ⏳ Kevin Foster - **To be created**
- ✅ Katie Dunn

---

## 🔧 SQL to Create Remaining Users

Run this in Supabase SQL Editor to create Paul and Kevin:

**File:** `/supabase/add-oversight-users.sql`

After running, verify with:
```sql
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as name,
  p.committee,
  p.role,
  p.must_change_password
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('prandall@rpgcc.co.uk', 'kfoster@rpgcc.co.uk');
```

---

*Last Updated: December 2024*

