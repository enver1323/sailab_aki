# AKI Labeling Guide (Quick)

## Purpose
Use the patient detail page to assign feature-importance labels for model interpretation.

## Who can do what
- Any logged-in user can create/edit feature labels for a patient.
- Labels are saved per user and per patient record.
- Admin users can also upload patient files and export all saved labels.

## Quick workflow
1. Open the app and log in.
2. Go to `Predictions -> Periodic` (or directly `/predictions/periodic`).
3. Find a patient and open detail view (`View detail`), URL like `/predictions/dashboard/<record_id>`.
4. Click data points/features on charts/tables (creatinine, labs, vitals, comorbidity items, prescriptions, basic info).
5. In the small popup, choose label level for the clicked feature:
   - `0` = Not Important
   - `1` = Important
   - `2` = Very Important
6. Repeat for all features you want to label.
7. Click `Save N features` at the bottom.
8. In `Evaluation Preview`, review/edit values, then click `Save`.

## Ground truth table
- The ground-truth row under the creatinine graph shows:
  - `+` = AKI positive at that day-slot in dataset data.
  - `-` = AKI negative (or missing/non-positive value).

## Important save behavior
- Pressing `Save` replaces your previous labels for that patient (full overwrite for your user).
- Current implementation saves by feature key name, not strictly by time slot.  
  If you label the same feature from different slots, the latest selection can overwrite the previous one.

## Admin-only actions
- Upload data from patient list using `Add Data`.
- Export all evaluations via backend endpoint:
  - `GET /api/patients/evaluations/export`

## Recommended labeling routine
1. Label creatinine-related signals first.
2. Label major vitals/lab abnormalities.
3. Label medication/treatment exposures.
4. Do a final pass in `Evaluation Preview` and save once.
