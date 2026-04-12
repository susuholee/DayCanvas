import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Session } from '@supabase/supabase-js';
import type { Todo } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
// removed lucide-react import

interface CalendarViewProps {
  todos: Todo[];
  session: Session;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
}

interface GoogleEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  htmlLink: string;
}

export function CalendarView({ todos, session, onAlert }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);

  useEffect(() => {
    fetchGoogleEvents();
  }, [currentDate]);

  const fetchGoogleEvents = async () => {
    const providerToken = session.provider_token;
    if (!providerToken) return;

    try {
      const timeMin = startOfMonth(currentDate).toISOString();
      const timeMax = endOfMonth(currentDate).toISOString();
      
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          },
          headers: {
            Authorization: `Bearer ${providerToken}`,
          },
        }
      );
      
      setGoogleEvents(response.data.items || []);
    } catch (error) {
      console.error('Error fetching Google events:', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border border-zinc-200 rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={prevMonth} 
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em] px-3 py-1 border border-zinc-100 rounded-lg"
          >
            이전
          </button>
          <h3 className="text-2xl font-extrabold tracking-tighter min-w-[160px] text-center text-zinc-900">
            {format(currentDate, 'yyyy년 MM월', { locale: ko })}
          </h3>
          <button 
            onClick={nextMonth} 
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em] px-3 py-1 border border-zinc-100 rounded-lg"
          >
            다음
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">일정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">구글 캘린더</span>
          </div>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-[2rem] overflow-hidden bg-white shadow-2xl">
        <div className="flex border-b border-zinc-100">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="flex-1 basis-[14.2857%] py-5 text-center text-[10px] font-black text-zinc-400 tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap">
          {days.map((day) => {
            const isCurrentMonth = isSameDay(startOfMonth(day), startOfMonth(currentDate));
            const dayTodos = todos.filter(t => {
              if (t.category !== 'note') return false;
              const dateToCompare = t.due_date || t.created_at;
              return dateToCompare && isSameDay(new Date(dateToCompare), day);
            });
            const dayEvents = googleEvents.filter(e => {
              const start = e.start.date || e.start.dateTime;
              return start && isSameDay(new Date(start), day);
            });

            return (
              <div 
                key={day.toString()} 
                className={`basis-[14.2857%] min-h-[140px] p-3 border-r border-b border-zinc-100 transition-all hover:bg-zinc-50 relative group ${!isCurrentMonth ? 'bg-zinc-50/50 grayscale opacity-30 pointer-events-none' : ''}`}
              >
                <div className={`text-sm font-extrabold mb-3 inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isSameDay(day, new Date()) ? 'bg-zinc-900 text-white scale-110 shadow-lg' : 'text-zinc-400'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1.5">
                  {dayTodos.map(todo => (
                    <div 
                      key={todo.id} 
                      className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 truncate tracking-tight shadow-sm transition-all hover:bg-zinc-900 hover:text-white cursor-default"
                    >
                      {todo.title}
                    </div>
                  ))}
                    {dayEvents.map(event => (
                      <a 
                        key={event.id} 
                        href={event.htmlLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 truncate hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <span className="text-[8px] font-black mr-1 opacity-50">CAL</span>
                        {event.summary}
                      </a>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
