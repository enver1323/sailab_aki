from enum import Enum


class APIItems(Enum):
    MESSAGE = "message"
    DATA = "data"
    ERRORS = "errors"

    ACCESS_TOKEN = "access_token"
    REFRESH_TOKEN = "refresh_token"

    PAGINATION = "pagination"
    TOTAL = "total"
    PAGE = "page"
    PER_PAGE = "per_page"
    NEXT = "next"
    PREV = "prev"
    ITEMS = "items"

    DAY = "day"
    DATE = "date"
    SLOT = "slot"
    CREATININE = "creatinine"
    B_CR = "b_cr"
    PROBABILITY = "probability"
    PROBABILITY_CRITICAL = "probability_critical"
    PROBABILITY_DAILY = "probability_daily"
    THRESHOLD = "threshold"
    GROUND_TRUTH = "ground_truth"
    FIELD = "field"
    VALUE = "value"
    LRP_VALUE = "lrp_value"
    ORIGINAL_VALUE = "original_value"
    ORIGINAL_CRITICAL_VALUE = "original_critical_value"
    COMMENT = "comment"
    CATEGORY = "category"

    SMALL = "small"
    MID = "mid"
    LONG = "long"

    STATUS = "status"
    PATIENT = "patient"

    STATIC = "static"
    DYNAMIC = "dynamic"
    BINARY = "binary"

    ACCURACY = "accuracy"
    PRECISION = "precision"
    RECALL = "recall"

    GENERAL = "general"
    CRITICAL = "critical"

    PRE6M = "pre6m"
    DAILY = "daily"

    MODEL_WINDOW = "model_window"
    MODEL_INPUT_DAY = "model_input_day"
    INPUT_START_DAY = "input_start_day"
    INPUT_END_DAY = "input_end_day"
    OUTPUT_START_DAY = "output_start_day"
    OUTPUT_END_DAY = "output_end_day"
    N_DAYS = "n_days"
    N_SLOTS = "n_slots"
