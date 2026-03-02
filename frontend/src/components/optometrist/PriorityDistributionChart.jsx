// src/components/optometrist/PriorityDistributionChart.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Baby,
  UserCheck,
  Clock,
  Send,
  RefreshCw,
  Stethoscope
} from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';

const PriorityDistributionChart = () => {
  const {
    getPatientStatistics,
    patientStatistics: stats,
    statisticsLoading,
    statisticsError
  } = useOptometristStore();

  React.useEffect(() => {
    getPatientStatistics();
  }, [getPatientStatistics]);

  // Loading state
  if (statisticsLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Priority Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (statisticsError) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center text-red-500">
          Failed to load patient statistics
        </CardContent>
      </Card>
    );
  }

  // No data
  if (stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Priority Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No patients in queue</p>
            <p className="text-sm">Priority distribution will appear when patients are added</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityCounts = stats.priorityCounts || {};

  const chartData = [
    {
      name: 'Emergency',
      value: priorityCounts.emergency ?? 0,
      color: 'hsl(0, 84%, 60%)',
      icon: AlertTriangle,
      description: 'Emergency cases'
    },
    {
      name: 'Children',
      value: priorityCounts.children ?? 0,
      color: 'hsl(217, 91%, 60%)',
      icon: Baby,
      description: 'Children'
    },
    {
      name: 'Seniors',
      value: priorityCounts.seniors ?? 0,
      color: 'hsl(142, 76%, 36%)',
      icon: UserCheck,
      description: 'Senior patients'
    },
    {
      name: 'Long Wait',
      value: priorityCounts.longwait ?? 0,
      color: 'hsl(271, 81%, 56%)',
      icon: Clock,
      description: 'Patients waiting for a long time'
    },
    {
      name: 'Referral',
      value: priorityCounts.referral ?? 0,
      color: 'hsl(199, 89%, 48%)',
      icon: Send,
      description: 'Referral cases'
    },
    {
      name: 'Follow-up',
      value: priorityCounts.followup ?? 0,
      color: 'hsl(160, 84%, 39%)',
      icon: RefreshCw,
      description: 'Follow-up visits'
    },
    {
      name: 'Pre / Post Op',
      value: priorityCounts.prepostop ?? 0,
      color: 'hsl(24, 94%, 50%)',
      icon: Stethoscope,
      description: 'Pre-operative and post-operative patients'
    },
    {
      name: 'Routine',
      value: priorityCounts.routine ?? 0,
      color: 'hsl(38, 92%, 50%)',
      icon: Users,
      description: 'Routine visits'
    }
  ].filter(item => item.value > 0);


  const totalPatients = Object.values(priorityCounts).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.description}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {data.value} patient{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
      {payload.map((entry, index) => {
        const Icon = entry.payload.icon;
        return (
          <div key={index} className="flex items-center gap-1 sm:gap-2">
            <span
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: entry.color }} />
            <span className="text-xs sm:text-sm font-medium">{entry.value}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              ({entry.payload.value})
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-6 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          Priority Distribution
        </CardTitle>
        <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span>Total: {totalPatients}</span>
          <span>Active: {stats.active}</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 flex-1 min-h-0">
        <div className="h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="65%"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorityDistributionChart;
