'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Plus, Play, Pause, BarChart } from 'lucide-react';

export default function AutomationPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const tenantId = 'tenant-1';
      const response = await fetch(`/api/automation/rules?tenantId=${tenantId}`);
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-muted-foreground mt-2">Create workflows to automate repetitive tasks</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))
        ) : (
          rules.map((rule: any) => (
            <Card key={rule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Trigger</p>
                      <Badge variant="outline">{rule.triggerType.replace('_', ' ')}</Badge>
                    </div>
                    {rule._count?.executions !== undefined && (
                      <div>
                        <p className="text-sm font-medium mb-1">Executions</p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <BarChart className="h-4 w-4" />
                          <span>{rule._count.executions}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRule(rule.id, rule.isActive)}
                    >
                      {rule.isActive ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && rules.length === 0 && (
        <Card className="p-12 text-center">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No automation rules</h3>
          <p className="text-muted-foreground mb-4">Create your first automation workflow</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </Card>
      )}
    </div>
  );
}
