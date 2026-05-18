"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type DailyDataPoint = {
  date: string;   // "5/1" 形式
  問い合わせ: number;
  生成数: number;
  PV: number;
  UU: number;
};

export function TrendChart({ data }: { data: DailyDataPoint[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        30日間トレンド
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="PV"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="UU"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="問い合わせ"
            stroke="#e84730"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="生成数"
            stroke="#f2971b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export type WeeklyDataPoint = {
  week: string;   // "5/5週" 形式
  問い合わせ: number;
  生成数: number;
  PV: number;
  UU: number;
};

export function WeeklyBarChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        週別推移（直近8週）
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="PV" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="UU" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="問い合わせ" fill="#e84730" radius={[4, 4, 0, 0]} />
          <Bar dataKey="生成数" fill="#f2971b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
