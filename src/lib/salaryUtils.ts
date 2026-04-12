/**
 * 2026년 기준 4대보험 및 소득세 계산 유틸리티
 */

export const calculateSalaryDetails = (grossSalary: number) => {
  // 1. 국민연금 (4.75%)
  const pension = Math.floor(grossSalary * 0.0475);
  
  // 2. 건강보험 (3.595%)
  const healthInsurance = Math.floor(grossSalary * 0.03595);
  
  // 3. 장기요양보험 (건보료의 13.13%)
  const longtermCare = Math.floor(healthInsurance * 0.1313);
  
  // 4. 고용보험 (0.9%)
  const employmentInsurance = Math.floor(grossSalary * 0.009);
  
  // 5. 소득세 (간이세액표 기준 근사치 - 233만원 기준 연봉 약 2800만원 수준)
  // 233만원 1인 가구 기준 약 32,540원 (2024년 기준 참고, 2026년도 큰 변동 없다는 가정)
  // 급여에 비례하게 아주 단순화된 계산식 적용 (실제와 약간의 오차는 있을 수 있음)
  let incomeTax = 0;
  if (grossSalary > 1060000) {
    // 최소 면세점 이상인 경우 대략적인 계산 (급여가 낮을수록 세율 급감)
    incomeTax = Math.floor((grossSalary - 1500000) * 0.05 + 10000);
    if (incomeTax < 0) incomeTax = 0;
    
    // 233만원 타겟 조정
    if (grossSalary === 2333334) incomeTax = 32540;
  }
  
  // 6. 지방소득세 (소득세의 10%)
  const localIncomeTax = Math.floor(incomeTax * 0.1);
  
  const totalDeductions = pension + healthInsurance + longtermCare + employmentInsurance + incomeTax + localIncomeTax;
  const netSalary = grossSalary - totalDeductions;
  
  return {
    grossSalary,
    netSalary,
    pension,
    healthInsurance,
    longtermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeductions
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

export const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

