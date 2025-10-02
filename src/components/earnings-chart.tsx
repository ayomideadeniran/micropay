"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Day 1", strk: 0.5, btc: 2500, usd: 1.2 },
  { name: "Day 5", strk: 1.2, btc: 5200, usd: 2.8 },
  { name: "Day 10", strk: 2.1, btc: 8900, usd: 4.5 },
  { name: "Day 15", strk: 3.8, btc: 15200, usd: 7.2 },
  { name: "Day 20", strk: 5.2, btc: 22100, usd: 9.8 },
  { name: "Day 25", strk: 7.1, btc: 31500, usd: 13.4 },
  { name: "Day 30", strk: 9.8, btc: 45600, usd: 18.7 },
]

export function EarningsChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
          <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(131, 83, 226, 0.3)",
              borderRadius: "8px",
              color: "white",
            }}
            formatter={(value, name) => {
              if (name === "usd") return [`$${value}`, "USD Earnings"]
              if (name === "strk") return [`${value} STRK`, "STRK Earnings"]
              if (name === "btc") return [`${value} sats`, "BTC Earnings"]
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="usd"
            stroke="#8353E2"
            strokeWidth={3}
            dot={{ fill: "#8353E2", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#8353E2", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="strk"
            stroke="#276100"
            strokeWidth={2}
            dot={{ fill: "#276100", strokeWidth: 2, r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
