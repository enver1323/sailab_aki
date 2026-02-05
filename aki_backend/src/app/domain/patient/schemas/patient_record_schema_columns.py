N_DAYS = 7
N_SLOTS = 3

GENERAL_DATA_COLUMNS = (
    "p_id",
    "age",
    "sex",
    "bmi",
    "b_egfr",
    "icu",
    "b_cr",
    "department",
    "stay_length",
    "admin_room",
    "date_discharge",
)

BINARY_DATA_COLUMNS = (
    "ami",
    "chf",
    "pvd",
    "cvd",
    "dementia",
    "pulmonary_disease",
    "ctd",
    "peptic_ulcer",
    "liver_disease",
    "severe_liver_disease",
    "diabetes",
    "diabetic_complication",
    "paraplegia",
    "renal_disease",
    "cancer",
    "metastatic_cancer",
    "htn",
    "aki",
    "cci",
)

TEST_SMALL_RANGE_COLUMNS = {
    "albumin": "albumin_avg",
    "bilirubin": "bilirubin_avg",
    "creatinine": "creatinine_avg",
    "potassium": "potassium_avg",
}
TEST_MID_RANGE_COLUMNS = {
    "crp": "crp_avg",
    "hematocrit": "hematocrit_avg",
    "bun": "bun_avg",
    "calcium": "calcium_avg",
    "co2": "co2_avg",
    "hb": "hb_avg",
    "wbc": "wbc_avg",
}
TEST_LONG_RANGE_COLUMNS = {
    "chloride": "chloride_avg",
    "glucose": "glucose_avg",
    "plt": "plt_avg",
    "sodium": "sodium_avg",
    "phosphorus": "phosphorus_avg",
}

VITAL_DATA_COLUMNS = ("sbp", "dbp", "bt", "pr")

CREATININE_COLUMNS = tuple(
    f"d{day}_{slot}_creatinine_avg"
    for day in range(1, N_DAYS + 1)
    for slot in range(1, N_SLOTS + 1)
)

PRESCRIPTION_COLUMNS = (
    "vasopressor",
    "vancomycin",
    "tacrolimus",
    "statin",
    "nsaid",
    "diuretics",
    "cyclosporin",
    "colistin",
    "cisplatin",
    "ccb",
    "betablocker",
    "arb",
    "amphotericin",
    "aminoglycoside",
    "acyclovir",
    "acei",
)

TREATMENT_COLUMNS = (
    "rbc",
    "contrast",
    "dialysis",
    "antibiotic_j01a",
    "antibiotic_j01c",
    "antibiotic_j01d",
    "antibiotic_j01e",
    "antibiotic_j01f",
    "antibiotic_j01m",
    "antibiotic_j01x",
)

SURGERY_COLUMNS = [
    "surgery_time",
    "anes_non_general",
    "anes_general",
    "asa_class",
    "surgery_time",
    "op_risk_score",
]
