"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, Edit, Trash2, Users, Lock, RefreshCw } from 'lucide-react';
import { Permission, formatPermission, groupPermissionsByCategory } from '@/lib/rbac';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem?: boolean;
  userCount?: number;
  users?: any[];
  createdAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  const fetchRoles = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/rbac/roles');
      if (res.ok) {
        const json = await res.json();
        // API returns { data: [...] }
        setRoles(json.data ?? json ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRole ? `/api/rbac/roles?id=${editingRole.id}` : '/api/rbac/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchRoles();
        setDialogOpen(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Delete this role? Users with this role will lose their permissions.')) return;
    
    try {
      const res = await fetch(`/api/rbac/roles?id=${roleId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRoles();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', permissions: role.permissions });
    setDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const permissionGroups = groupPermissionsByCategory(Object.values(Permission));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Configure user roles and permissions across the system.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchRoles} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingRole(null); setFormData({ name: '', description: '', permissions: [] }); }}>
                <Plus className="mr-2 h-4 w-4" /> Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                <DialogDescription>Define role name, description, and assign permissions.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Role Name</label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Sales Manager" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe this role's responsibilities..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Permissions</label>
                  <div className="space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {Object.entries(permissionGroups).map(([category, permissions]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 capitalize">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {permissions.map(permission => (
                            <label key={permission} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input type="checkbox" checked={formData.permissions.includes(permission)} onChange={() => togglePermission(permission)} className="rounded" />
                              <span>{formatPermission(permission)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingRole ? 'Update Role' : 'Create Role'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-gray-500">Loading roles...</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map(role => (
            <Card key={role.id} className={`hover:shadow-lg transition-shadow ${role.isSystem ? 'border-blue-200 bg-blue-50/30' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  {role.isSystem && <Badge variant="secondary">System</Badge>}
                </div>
                <CardDescription>{role.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Users className="h-4 w-4" /> Users:</span>
                  <span className="font-medium">{role.userCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Lock className="h-4 w-4" /> Permissions:</span>
                  <span className="font-medium">{role.permissions.length}</span>
                </div>
                {!role.isSystem && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(role)}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(role.id)} disabled={(role.userCount ?? 0) > 0}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
