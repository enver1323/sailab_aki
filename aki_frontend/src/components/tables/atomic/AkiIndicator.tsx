import { AKIPredictionType } from "../../../types/patientTypes";

const akiTypeToText = (type: AKIPredictionType): string => {
  switch(type) {
    case "recovery":
      return "회복"
    case "safe":
      return "안전"
    case "mild":
      return "경증"
    case "severe":
      return "중증"
  }
}

const AkiIndicator: React.FC<{akiType: AKIPredictionType}> = ({akiType}) => {
  let backgroundColor = '';
  switch (akiType) {
    case "recovery":
      backgroundColor = '#00B512';
      break;
    case "safe":
        backgroundColor = '#00B512';
        break;
    case "mild":
      backgroundColor = '#FBA465';
      break;
    case "severe":
      backgroundColor = '#FF4141';
      break;
    default:
      backgroundColor = '#3E3E3E';
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '3px'}}>
      <div style={{ backgroundColor , width: 12, height: 12, borderRadius: 6 }} />
      <span style={{color: backgroundColor}}>{akiTypeToText(akiType)}</span>
    </div>
  );
}

export default AkiIndicator