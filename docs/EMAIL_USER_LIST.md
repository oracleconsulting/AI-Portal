# Complete User List for Email Distribution

## 📧 Quick Copy-Paste List

### Implementation Committee (11 members)

1. **James Howard** - jhoward@rpgcc.co.uk (Admin - Custom password)
2. **Laura Pond** - lpond@rpgcc.co.uk - Password: `RPGCC2024!`
3. **Steve Johnson** - sjohnson@rpgcc.co.uk - Password: `RPGCC2024!`
4. **Grace Bischoff** - gbischoff@rpgcc.co.uk - Password: `RPGCC2024!`
5. **Tim Humphries** - thumphries@rpgcc.co.uk - Password: `RPGCC2024!`
6. **Adam Thompson** - athompson@rpgcc.co.uk - Password: `RPGCC2024!`
7. **James Palmer** - jpalmer@rpgcc.co.uk - Password: `RPGCC2024!`
8. **Sam Stern** - sstern@rpgcc.co.uk - Password: `RPGCC2024!`
9. **Katy Dunn** - kdunn@rpgcc.co.uk - Password: `RPGCC2024!`
10. **Charlotte Stead** - cstead@rpgcc.co.uk - Password: `RPGCC2024!`
11. **Nicola Sidoli** - nsidoli@rpgcc.co.uk - Password: `RPGCC2024!`

### Oversight Committee (5 members)

1. **James Howard** - jhoward@rpgcc.co.uk (Admin - Custom password)
2. **Steve Johnson** - sjohnson@rpgcc.co.uk - Password: `RPGCC2024!`
3. **Paul Randall** - prandall@rpgcc.co.uk - Password: `RPGCC2024!` ⚠️ *To be created*
4. **Kevin Foster** - kfoster@rpgcc.co.uk - Password: `RPGCC2024!` ⚠️ *To be created*
5. **Katie Dunn** - kdunn@rpgcc.co.uk - Password: `RPGCC2024!`

---

## 🔧 Action Required

**Before sending emails, run this SQL in Supabase:**

File: `/supabase/add-oversight-users.sql`

This creates:
- Paul Randall (prandall@rpgcc.co.uk)
- Kevin Foster (kfoster@rpgcc.co.uk)

Both with password: `RPGCC2024!` (must change on first login)

---

## 📝 Email Template

```
Subject: Welcome to the RPGCC AI Portal

Dear [Name],

You now have access to the RPGCC AI Portal - our secure platform for managing AI implementation initiatives.

LOGIN DETAILS:
🌐 Portal: https://ai.torsor.co.uk
📧 Email: [email]
🔑 Password: RPGCC2024!

⚠️ IMPORTANT: You must change your password on first login.

YOUR ACCESS:
- Committee: [Implementation/Oversight] Committee
- Role: [Member/Admin]

WHAT YOU CAN DO:
[For Implementation Committee]
• Submit AI opportunity identification forms
• Calculate ROI for proposed solutions
• Track project status and analytics
• Create post-implementation reviews

[For Oversight Committee]
• Review high-value proposals (≥£5,000)
• Manage AI tool registry
• Review policies and governance
• Track security and compliance

If you have any questions, please contact James Howard.

Best regards,
RPGCC AI Initiative Team
```

---

## ✅ Checklist

- [ ] Run `/supabase/add-oversight-users.sql` in Supabase
- [ ] Verify Paul and Kevin are created (check verification query in SQL file)
- [ ] Send emails to all Implementation Committee members (11)
- [ ] Send emails to all Oversight Committee members (5)
- [ ] Monitor for any login issues

---

*Ready for distribution - December 2024*

