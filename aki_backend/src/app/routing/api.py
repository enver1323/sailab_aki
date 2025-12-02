from flask import Blueprint
from flask_restx import Api

from app.domain.user.controllers.auth_controller import (
    AuthLogin,
    AuthRegister,
    AuthRefresh,
    AuthLogout
)
from app.domain.user.controllers.user_controller import (
    UserList,
    UserProfile
)
from app.domain.patient.controllers.patient_controller import (
    PatientList,
    PatientMedicalRecordDetails,
    PatientMedicalRecordPredictions,
    PatientUserInterestController,
    PatientEvaluation,
    PatientMedicalRecordEvaluations,
)
from app.domain.user.controllers.department_controller import (
    DepartmentList,
    DepartmentDetails
)

api_bp = Blueprint('/api', __name__, url_prefix='/api')
api = Api(api_bp)

routes = {
    '/login': AuthLogin,
    '/register': AuthRegister,
    '/logout': AuthLogout,
    '/refresh': AuthRefresh,

    '/users': UserList,
    '/users/<int:user_id>': UserProfile,

    '/patients': PatientList,
    '/patients/evaluate': PatientEvaluation,
    '/patients/records/<int:patient_medical_record_id>': PatientMedicalRecordDetails,
    '/patients/predictions/<int:patient_medical_record_id>': PatientMedicalRecordPredictions,
    '/patients/evaluations/<int:patient_medical_record_id>': PatientMedicalRecordEvaluations,
    '/patients/interest': PatientUserInterestController,

    '/departments': DepartmentList,
    '/departments/<int:department_id>': DepartmentDetails,
}

for url_rule, action in routes.items():
    api.add_resource(action, url_rule)
