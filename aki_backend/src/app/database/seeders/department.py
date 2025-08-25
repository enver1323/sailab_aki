from typing import Dict, Any
from sqlalchemy import insert, func
from sqlalchemy.orm import Session
from app.domain.user.entities.department import Department


def template(
    external_id: str,
    idx: int,
    thresh_freq: float = 0.5,
    thresh_rare: float = 0.5,
    thresh_rec: float = 0.5,
    name: str = None,
) -> Dict[str, Any]:
    return {
        "name": name or external_id,
        "external_id": external_id,
        "external_label_id": idx,
        "threshold_freq": thresh_freq,
        "threshold_rare": thresh_rare,
        "threshold_recovery": thresh_rec,
    }


def seed(session: Session):
    data = [
        template("기타비수술과", 0, None, None, None, name="세분화"),
        template("기타비수술과2", 1, None, None, None, name="세분화"),
        template("기타수술과", 2, None, None, None),
        template("비뇨의학과", 3, None, None, None),
        template("산부인과", 4, None, None, None),
        template("소화기내과", 5, 0.5, 0.5, None),
        template("순환기내과", 6, 0.75, 0.85, None),
        template("신경과", 7, 0.5, 0.5, None),
        template("신경외과", 8, None, None, None),
        template("신장내과", 9, 0.9, 0.55, None),
        template("심장혈관흉부외과", 10, None, None, None),
        template("외과", 11, None, None, None),
        template("응급의학과", 12, None, None, None),
        template("정형외과", 13, None, None, None),
        template("혈액종양내과", 14, None, None, None),
        template("호흡기내과", 15, 0.6, 0.8, None),
    ]

    return session.execute(insert(Department), data)
