// src/components/dashboard/StatCard.jsx
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon, color = "bg-blue-50" }) {
  return (
    <Card className={color}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-opacity-20 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}