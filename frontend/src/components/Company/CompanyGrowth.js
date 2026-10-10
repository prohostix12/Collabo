import React, { useState, useEffect } from 'react';
import {
  // eslint-disable-next-line no-unused-vars
  LineChart,
  // eslint-disable-next-line no-unused-vars
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  // eslint-disable-next-line no-unused-vars
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const CompanyGrowth = () => {
  // eslint-disable-next-line no-unused-vars
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Auto-generate realistic increasing data for 12 months with seasonal patterns
  const generateGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseRevenue = 45000;
    const baseUsers = 1200;
    const basePerformance = 65;

    // Seasonal multipliers (e.g., Q4 holiday boost, summer dip)
    const seasonalFactors = [
      0.92, // Jan - Post-holiday slowdown
      0.95, // Feb - Recovery
      1.05, // Mar - Spring boost
      1.08, // Apr - Strong quarter end
      1.02, // May - Steady
      0.98, // Jun - Summer start
      0.96, // Jul - Summer dip
      0.97, // Aug - Back to school prep
      1.03, // Sep - Fall momentum
      1.06, // Oct - Pre-holiday
      1.12, // Nov - Holiday season
      1.15, // Dec - Peak season
    ];

    return months.map((month, index) => {
      // Base growth trend (10-15% overall annual growth)
      const trendGrowth = 1 + (index * 0.012);
      
      // Seasonal variation
      const seasonal = seasonalFactors[index];
      
      // Random variance (±3-5%)
      const randomVariance = 0.97 + (Math.random() * 0.06);
      
      // Compound all factors
      const totalFactor = trendGrowth * seasonal * randomVariance;

      // Calculate values with realistic patterns
      const revenue = Math.round(baseRevenue * totalFactor);
      const users = Math.round(baseUsers * totalFactor * (0.98 + Math.random() * 0.04));
      const performance = Math.min(100, Math.round(
        basePerformance * (1 + index * 0.035) * (0.98 + Math.random() * 0.04)
      ));

      return {
        month,
        revenue,
        users,
        performance,
        // Additional metrics for richer data
        engagement: Math.round(70 + index * 2 + (Math.random() * 5)),
        conversion: Number((2.5 + index * 0.15 + (Math.random() * 0.3)).toFixed(2)),
      };
    });
  };

  const [data] = useState(generateGrowthData());

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate growth percentage
  const calculateGrowth = (metric) => {
    const firstValue = data[0][metric];
    const lastValue = data[data.length - 1][metric];
    return (((lastValue - firstValue) / firstValue) * 100).toFixed(1);
  };

  // Metric configurations
  const metrics = {
    revenue: {
      label: 'Revenue',
      icon: DollarSign,
      color: '#8915A0',
      gradient: ['#8915A0', '#EC4899'],
      format: (value) => `₹${(value / 1000).toFixed(0)}K`,
      growth: calculateGrowth('revenue'),
    },
    users: {
      label: 'Active Users',
      icon: Users,
      color: '#EC4899',
      gradient: ['#EC4899', '#F59E0B'],
      format: (value) => value.toLocaleString(),
      growth: calculateGrowth('users'),
    },
    performance: {
      label: 'Performance Index',
      icon: Activity,
      color: '#10B981',
      gradient: ['#10B981', '#3B82F6'],
      format: (value) => `${value}%`,
      growth: calculateGrowth('performance'),
    },
  };

  const currentMetric = metrics[selectedMetric];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-900">
                {currentMetric.label}: {currentMetric.format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom dot for line chart
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.month === 'Dec') {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={currentMetric.color}
            stroke="#fff"
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill={currentMetric.color}
            opacity={0.2}
          />
        </g>
      );
    }
    return null;
  };

  return (
    <section className="w-full bg-gradient-to-br from-gray-50 to-white py-12 sm:py-16 lg:py-20">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Company Growth
              </h2>
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-900 max-w-3xl">
            Track our remarkable journey over the past year. Our consistent growth
            reflects our commitment to excellence and innovation in delivering
            exceptional value to our clients.
          </p>
        </div>

        {/* Metric Selector Cards */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(metrics).map(([key, metric]) => {
              const Icon = metric.icon;
              const isActive = selectedMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-600 to-accent-500 shadow-2xl shadow-primary-500/50'
                      : 'bg-white hover:shadow-xl border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-white/20' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isActive ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                    </div>
                    <div
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                        isActive ? 'bg-white/20' : 'bg-green-100'
                      }`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-green-600'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? 'text-white' : 'text-green-600'
                        }`}
                      >
                        +{metric.growth}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isActive ? 'text-white/80' : 'text-gray-900'
                      }`}
                    >
                      {metric.label}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isActive ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {metric.format(data[data.length - 1][key])}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isActive ? 'text-white/60' : 'text-gray-900'
                      }`}
                    >
                      Current (Dec)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph Container */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8 lg:p-10">
            {/* Graph Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {currentMetric.label} Growth Trend
                </h3>
                <p className="text-sm text-gray-900">
                  12-month performance overview (Jan - Dec)
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentMetric.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {currentMetric.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Graph */}
            <div className="w-full" style={{ minHeight: '400px' }}>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={`gradient-${selectedMetric}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={currentMetric.gradient[0]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={currentMetric.gradient[1]}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#111827"
                    style={{ fontSize: '14px', fontWeight: '500' }}
                  />
                  <YAxis
                    stroke="#111827"
                    style={{ fontSize: '14px', fontWeight: '500' }}
                    tickFormatter={currentMetric.format}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={currentMetric.color}
                    strokeWidth={3}
                    fill={`url(#gradient-${selectedMetric})`}
                    animationDuration={2000}
                    animationBegin={0}
                    dot={<CustomDot />}
                    activeDot={{
                      r: 8,
                      fill: currentMetric.color,
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-900 mb-1">Starting Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentMetric.format(data[0][selectedMetric])}
                  </p>
                  <p className="text-xs text-gray-900 mt-1">January</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-900 mb-1">Current Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentMetric.format(data[data.length - 1][selectedMetric])}
                  </p>
                  <p className="text-xs text-gray-900 mt-1">December</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-900 mb-1">Total Growth</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    +{currentMetric.growth}%
                  </p>
                  <p className="text-xs text-gray-900 mt-1">Year-over-Year</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-900 mb-1">Avg. Monthly</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentMetric.format(
                      Math.round(
                        data.reduce((sum, item) => sum + item[selectedMetric], 0) /
                          data.length
                      )
                    )}
                  </p>
                  <p className="text-xs text-gray-900 mt-1">Average</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info with Data Insights */}
        <div className="max-w-7xl mx-auto mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Insights */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-200">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Consistent Growth Trajectory
                  </h4>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    Our data shows a steady upward trend across all key metrics,
                    demonstrating strong market performance and customer satisfaction.
                    This growth is driven by our innovative solutions, dedicated team,
                    and commitment to delivering exceptional value.
                  </p>
                </div>
              </div>
            </div>

            {/* Seasonal Patterns */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Seasonal Performance Patterns
                  </h4>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    Notice the natural business cycles: Q4 shows peak performance with
                    holiday season momentum, while summer months reflect typical market
                    patterns. Our strategy adapts to these cycles for optimal results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyGrowth;
