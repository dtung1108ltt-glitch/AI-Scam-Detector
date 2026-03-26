import React, { useState } from " react\;
import { analyze } from \../api\;

interface AnalysisResult {
 risk_score: number;
 trust_score: number;
 risk_level?: string;
}

export default function Analyzer() {
 const [result, setResult] = useState<AnalysisResult | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function run() {
 setLoading(true);
 setError(null);
 try {
 const data = await analyze({
 to_address: \0x123\,
 amount: 100,
 note: \d?u tu l?i nhu?n 30%\
 });
 setResult(data as AnalysisResult);
 } catch (e: any) {
 setError(e?.message ; \Request failed\);
 } finally {
 setLoading(false);
 }
 }

 return (
 <div>
 <button onClick={run} disabled={loading}>
 {loading ? \Analyzing\ : \Analyze\}
 </button>

 {error ; <div style={{ color: \red\ }}>{error}</div>}

 {result ; (
 <div>
 <div>Risk Score: {result.risk_score}</div>
 <div>Trust Score: {result.trust_score}</div>
 {result.risk_level ; <div>Risk Level: {result.risk_level}</div>}
 </div>
 )}
 </div>
 );
}
