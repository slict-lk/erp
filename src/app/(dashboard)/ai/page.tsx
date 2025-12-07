"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, TrendingUp, AlertCircle, Settings, RefreshCw, Brain, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface Forecast {
  period: string;
  prediction: number;
  confidence: number;
}

interface Insight {
  id: string;
  type: string;
  message: string;
  severity: string;
  createdAt: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount ?? 0);
}

export default function AIPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [forecastRes, insightsRes] = await Promise.all([
        fetch('/api/ai/forecast'),
        fetch('/api/ai/insights'),
      ]);

      if (forecastRes.ok) setForecasts((await forecastRes.json()) ?? []);
      if (insightsRes.ok) setInsights((await insightsRes.json()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI & Automation</h1>
          <p className="text-gray-600">Predictive analytics, intelligent insights, and automated workflows.</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="AI Models" value="3" subtitle="Active predictive models" icon={Brain} variant="pink" />
        <StatCard title="Predictions" value={String(forecasts.length)} subtitle="Generated forecasts" icon={TrendingUp} variant="violet" />
        <StatCard title="Insights" value={String(insights.length)} subtitle="Actionable recommendations" icon={Sparkles} variant="fuchsia" />
        <StatCard title="Automations" value="0" subtitle="Active workflows" icon={Zap} variant="rose" />
      </div>

      <Tabs defaultValue="forecasts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>AI-powered sales predictions based on historical data.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Generating forecasts..." />
              ) : forecasts.length === 0 ? (
                <EmptyState message="No forecasts available. Train model with historical data." />
              ) : (
                <div className="space-y-3">
                  {forecasts.map((forecast, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gradient-to-r from-pink-50 to-violet-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-pink-100 p-2"><TrendingUp className="h-5 w-5 text-pink-600" /></div>
                        <div>
                          <p className="font-semibold text-gray-900">{forecast.period}</p>
                          <p className="text-xs text-gray-500">Confidence: {(forecast.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(forecast.prediction)}</p>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <ArrowUp className="h-3 w-3" /> 12% vs last period
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Actionable recommendations from your business data.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Analyzing data..." />
              ) : insights.length === 0 ? (
                <EmptyState message="No insights generated yet." />
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                      <div className={`rounded-lg p-2 ${
                        insight.severity === 'HIGH' ? 'bg-red-100' :
                        insight.severity === 'MEDIUM' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        <AlertCircle className={`h-4 w-4 ${
                          insight.severity === 'HIGH' ? 'text-red-600' :
                          insight.severity === 'MEDIUM' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{insight.message}</p>
                          <Badge variant={insight.severity === 'HIGH' ? 'destructive' : 'secondary'}>{insight.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(insight.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-violet-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-pink-100 p-3"><Brain className="h-8 w-8 text-pink-600" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">AI Model Training</h3>
              <p className="text-sm text-gray-600">Continuously learning from your business data to improve predictions and recommendations.</p>
            </div>
            <Button variant="outline">Configure Models</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, variant }: { title: string; value: string; subtitle: string; icon: typeof Zap; variant: 'pink' | 'violet' | 'fuchsia' | 'rose' }) {
  const accentMap = { pink: 'bg-pink-100 text-pink-600', violet: 'bg-violet-100 text-violet-600', fuchsia: 'bg-fuchsia-100 text-fuchsia-600', rose: 'bg-rose-100 text-rose-600' } as const;
  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div><p className="text-sm font-medium text-gray-500">{title}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{subtitle}</p></div>
        <div className={`rounded-xl p-3 ${accentMap[variant]}`}><Icon className="h-6 w-6" /></div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-500">{message}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-sm text-gray-500">{message}</div>;
}
