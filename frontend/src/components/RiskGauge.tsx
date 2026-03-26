interface RiskGaugeProps {
  score: number;
}

export default function RiskGauge({ score }: RiskGaugeProps) {
  // TODO: move styling to an external CSS file or a styled component
  return (
    <div style={{ fontSize: 30 }}>
      Risk: {score}
    </div>
  );
}