import React, { useState, useEffect } from 'react';
import { supabase, type Salary } from '../lib/supabase';
import { calculateSalaryDetails, formatNumber } from '../lib/salaryUtils';

import { AlertModal } from './AlertModal';

export const SalaryView: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');

  const [grossSalary, setGrossSalary] = useState<number>(2333334);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    fetchSalaries();
  }, []);

  const { groupedSalaries, stats } = React.useMemo(() => {
    const grouped: { [key: string]: { records: Salary[], totalNet: number, totalGross: number } } = {};
    let totalAllTime = 0;
    const currentYear = new Date().getFullYear().toString();

    salaries.forEach(s => {
      const year = s.month.substring(0, 4);
      if (!grouped[year]) {
        grouped[year] = { records: [], totalNet: 0, totalGross: 0 };
      }
      grouped[year].records.push(s);
      grouped[year].totalNet += s.net_salary;
      grouped[year].totalGross += s.gross_salary;
      totalAllTime += s.net_salary;
    });

    return {
      groupedSalaries: grouped,
      stats: {
        totalAllTime,
        averageMonthly: salaries.length > 0 ? Math.round(totalAllTime / salaries.length) : 0,
        currentYearTotal: grouped[currentYear]?.totalNet || 0,
        count: salaries.length
      }
    };
  }, [salaries]);

  const fetchSalaries = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 기본 급여 불러오기
    const defaultGross = user.user_metadata?.default_gross_salary;
    if (defaultGross) {
      setGrossSalary(Number(defaultGross));
    }

    const { data, error } = await supabase
      .from('salaries')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching salaries:', error);
    } else {
      setSalaries(data || []);
    }
    setLoading(false);
  };

  const handleSaveDefaultSalary = async () => {
    setIsSavingDefault(true);
    const { error } = await supabase.auth.updateUser({
      data: { default_gross_salary: grossSalary }
    });

    if (error) {
      setModalType('error');
      setModalMessage('기본 급여 저장 중 오류가 발생했습니다.');
    } else {
      setModalType('success');
      setModalMessage('나의 기본 급여로 저장되었습니다. 다음 접속 시 이 금액이 기본으로 입력됩니다.');
    }
    setIsSavingDefault(false);
    setIsModalOpen(true);
  };

  const handleAddSalary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const details = calculateSalaryDetails(grossSalary);

    // 3월 말 특별 처리 (사용자 요청: 149,188원)
    let netSalary = details.netSalary;
    let finalGross = grossSalary;

    // 만약 날짜가 3월이고 금액을 직접 조정한 경우를 위해 로직 추가 가능
    // 여기서는 사용자가 입력한 grossSalary를 기반으로 저장함
    // 149,188원인 경우 세금을 0으로 처리하거나 단순 기록용으로 저장
    if (grossSalary === 149188) {
      netSalary = 149188;
    }

    const { error } = await supabase.from('salaries').insert([
      {
        user_id: user.id,
        month: grossSalary === 149188 ? `${selectedMonth}-${new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate()}` : `${selectedMonth}-05`,
        gross_salary: finalGross,
        net_salary: netSalary,

        pension: grossSalary === 149188 ? 0 : details.pension,
        health_insurance: grossSalary === 149188 ? 0 : details.healthInsurance,
        longterm_care: grossSalary === 149188 ? 0 : details.longtermCare,
        employment_insurance: grossSalary === 149188 ? 0 : details.employmentInsurance,
        income_tax: grossSalary === 149188 ? 0 : details.incomeTax,
        local_income_tax: grossSalary === 149188 ? 0 : details.localIncomeTax,
      },
    ]);

    if (error) {
      setModalType('error');
      setModalMessage('급여 기록 추가 중 오류가 발생했습니다.');
    } else {
      setModalType('success');
      setModalMessage('급여 기록이 성공적으로 추가되었습니다.');
      fetchSalaries();
    }
    setIsModalOpen(true);
    setIsAddModalOpen(false); // Close add modal on success
  };

  const handleDeleteAllSalaries = async () => {
    if (!window.confirm("정말로 모든 급여 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('salaries')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setModalType('error');
      setModalMessage('전체 삭제 중 오류가 발생했습니다.');
    } else {
      setModalType('success');
      setModalMessage('모든 급여 기록이 성공적으로 삭제되었습니다.');
      fetchSalaries();
    }
    setIsModalOpen(true);
  };

  const handleDeleteSalary = async (id: string) => {
    const { error } = await supabase.from('salaries').delete().eq('id', id);
    if (error) {
      setModalType('error');
      setModalMessage('삭제 중 오류가 발생했습니다.');
    } else {
      setModalType('success');
      setModalMessage('기록이 삭제되었습니다.');
      fetchSalaries();
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">월급 관리</h1>
          <p className="text-zinc-500 font-medium text-sm">성장의 기록을 전문적으로 관리하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteAllSalaries}
            className="text-[10px] font-black text-zinc-300 hover:text-red-500 transition-all uppercase tracking-widest px-3 py-2"
          >
            기록 초기화
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-bouncy py-2.5 px-6 text-sm"
          >
            이번 달 급여 수령 등록
          </button>
        </div>
      </div>

      {/* 대시보드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">누적 총 수령액</span>
          <h3 className="text-3xl font-black text-zinc-900 mb-1">{formatNumber(stats.totalAllTime)} <span className="text-sm font-bold text-zinc-400">원</span></h3>
          <p className="text-[11px] font-bold text-zinc-500">기록 시작 이후 총 누적 자산</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 7-3 5 3 5"/><path d="m19 7 3 5-3 5"/></svg>
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">월평균 수령액</span>
          <h3 className="text-3xl font-black text-white mb-1">{formatNumber(stats.averageMonthly)} <span className="text-sm font-bold text-zinc-500">원</span></h3>
          <p className="text-[11px] font-bold text-zinc-400">전체 기록 기준 월간 평균</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">{new Date().getFullYear()}년 총 수령</span>
          <h3 className="text-3xl font-black text-zinc-900 mb-1">{formatNumber(stats.currentYearTotal)} <span className="text-sm font-bold text-zinc-400">원</span></h3>
          <p className="text-[11px] font-bold text-zinc-500">올해 누적된 성장의 기록</p>
        </div>
      </div>

      <div className="flex flex-col gap-10 mb-12">
        {/* 히스토리 타임라인 - Full Width */}
          {loading ? (
            <div className="py-20 text-center text-zinc-400 font-medium italic">성장의 기록을 불러오는 중...</div>
          ) : Object.keys(groupedSalaries).length === 0 ? (
            <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-[3rem] text-zinc-400 font-medium">
              아직 등록된 월급 기록이 없습니다.
            </div>
          ) : (
            Object.entries(groupedSalaries)
              .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
              .map(([year, data]) => (
                <div key={year} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-2xl font-black text-zinc-900">{year}</h3>
                    <div className="h-[1px] flex-1 bg-zinc-100" />
                    <div className="text-right">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">연간 합계</span>
                      <span className="text-xs font-bold text-zinc-600">{formatNumber(data.totalNet)}원 수령</span>
                    </div>
                  </div>

                  <div className="space-y-4 relative pl-4 border-l border-zinc-100 ml-4">
                    {data.records.map((salary) => (
                      <div key={salary.id} className="relative">
                        <div className="absolute -left-[21px] top-8 w-2 h-2 rounded-full bg-zinc-200 border-2 border-white" />
                        <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all group">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-6">
                              <div className="min-w-[60px]">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">
                                  {salary.month.substring(5, 7)}월
                                </span>
                                <span className="text-[9px] font-bold text-zinc-300">
                                  {salary.month.substring(0, 4)}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-zinc-900">
                                  {formatNumber(salary.net_salary)} <span className="text-sm font-medium text-zinc-400 ml-0.5">원</span>
                                </h4>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                              <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">세전 급여</span>
                                <span className="text-xs font-bold text-zinc-600">{formatNumber(salary.gross_salary)}원</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">총 공제액</span>
                                <span className="text-xs font-bold text-red-400">-{formatNumber(salary.gross_salary - salary.net_salary)}원</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSalary(salary.id)}
                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
      </div>

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
        type={modalType}
      />

      {/* 급여 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-[480px] bg-white rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1">급여 수령 등록</h2>
                <p className="text-sm font-medium text-zinc-400 text-pretty">이번 달에 수령하신 소중한 월급 내역을 등록합니다.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[10px] font-black text-zinc-300 hover:text-zinc-900 transition-colors uppercase tracking-widest px-2"
              >
                닫기
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="input-label">해당 월</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="premium-input text-base"
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <button
                    onClick={() => {
                      setGrossSalary(149188);
                      setSelectedMonth("2026-03");
                    }}
                    className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-all"
                    title="3월 말 정산 세팅"
                  >
                    특수
                  </button>
                  <button
                    onClick={() => {
                      setGrossSalary(2333334);
                      setSelectedMonth(new Date().toISOString().substring(0, 7));
                    }}
                    className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-all"
                    title="정규 급여 세팅"
                  >
                    정규
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="input-label mb-0 font-black">세전 급여액</label>
                  <button
                    onClick={handleSaveDefaultSalary}
                    disabled={isSavingDefault}
                    className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-50"
                  >
                    {isSavingDefault ? '저장 중...' : '기본값 저장'}
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    value={formatNumber(grossSalary)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(val)) {
                        setGrossSalary(val === '' ? 0 : Number(val));
                      }
                    }}
                    className="premium-input text-2xl font-black py-4 h-auto"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-300">원</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {[10000, 50000, 100000, 1000000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setGrossSalary((prev) => prev + amount)}
                      className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all active:scale-95"
                    >
                      +{amount >= 1000000 ? `${amount/1000000}백만` : `${amount/10000}만`}
                    </button>
                  ))}
                  <button
                    onClick={() => setGrossSalary(0)}
                    className="px-4 py-2 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-black text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95 ml-auto"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {grossSalary > 0 && (
                <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">실수령액 자동 계산</span>
                    <span className="text-3xl font-black text-zinc-900">
                      {grossSalary === 149188 ? formatNumber(149188) : formatNumber(calculateSalaryDetails(grossSalary).netSalary)} <span className="text-sm font-bold text-zinc-400">원</span>
                    </span>
                  </div>
                  {grossSalary !== 149188 && (
                    <div className="space-y-3 text-[11px] font-bold text-zinc-400">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-200" /> 국민연금</span>
                        <span className="text-zinc-600">-{formatNumber(calculateSalaryDetails(grossSalary).pension)} 원</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-200" /> 건강보험</span>
                        <span className="text-zinc-600">-{formatNumber(calculateSalaryDetails(grossSalary).healthInsurance)} 원</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-200" /> 소득세 (지방세)</span>
                        <span className="text-zinc-600">-{formatNumber(calculateSalaryDetails(grossSalary).incomeTax + calculateSalaryDetails(grossSalary).localIncomeTax)} 원</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAddSalary}
                className="btn-bouncy w-full py-5 text-lg font-black"
              >
                급여 내역 등록 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
