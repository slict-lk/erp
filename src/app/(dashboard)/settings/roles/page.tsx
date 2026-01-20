'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, Plus, Edit, Trash2, Users, Lock, RefreshCw, Search, Check, X, Filter } from 'lucide-react';
import { Permission, formatPermission, groupPermissionsByCategory } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Search and Filter states for Permissions
  const [permissionSearch, setPermissionSearch] = useState('');

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

  const toggleCategory = (permissions: string[], shouldSelect: boolean) => {
    setFormData(prev => {
      const newPermissions = new Set(prev.permissions);
      permissions.forEach(p => {
        if (shouldSelect) newPermissions.add(p);
        else newPermissions.delete(p);
      });
      return { ...prev, permissions: Array.from(newPermissions) };
    });
  };

  const permissionGroups = useMemo(() => {
    const groups = groupPermissionsByCategory(Object.values(Permission));
    // Filter by search
    if (!permissionSearch) return groups;

    const filteredGroups: Record<string, string[]> = {};
    Object.entries(groups).forEach(([category, perms]) => {
      const filteredPerms = perms.filter(p =>
        p.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        category.toLowerCase().includes(permissionSearch.toLowerCase())
      );
      if (filteredPerms.length > 0) {
        filteredGroups[category] = filteredPerms;
      }
    });
    return filteredGroups;
  }, [permissionSearch]);

  const getSelectedCount = (categoryPerms: string[]) => {
    return categoryPerms.filter(p => formData.permissions.includes(p)).length;
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-2xl">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Role Management</h1>
          <p className="text-slate-300 text-lg">Define and control access levels across your organization.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchRoles} disabled={refreshing} className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingRole(null); setFormData({ name: '', description: '', permissions: [] }); }}
                className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/30">
                <Plus className="mr-2 h-4 w-4" /> Create New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50">
              <DialogHeader className="p-6 pb-4 bg-white border-b">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <DialogTitle className="text-xl">{editingRole ? 'Edit Role Configuration' : 'Create New Role'}</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 ml-11">
                  Configure role details and granular permissions. Changes affect all assigned users immediately.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1">
                <form id="role-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                  {/* Basic Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl border shadow-sm">
                    <div className="space-y-3">
                      <Label htmlFor="roleName" className="text-base font-semibold text-slate-900">Role Name</Label>
                      <Input
                        id="roleName"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Sales Manager"
                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                      <p className="text-xs text-slate-500">A unique name to identify this role in the system.</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="roleDesc" className="text-base font-semibold text-slate-900">Description</Label>
                      <Textarea
                        id="roleDesc"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the responsibilities and access level..."
                        className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Access Permissions</h3>
                        <p className="text-sm text-slate-500">Select the modules and actions this role can access.</p>
                      </div>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search permissions..."
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                          className="pl-9 h-9 bg-white"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <Accordion type="multiple" defaultValue={Object.keys(permissionGroups)} className="w-full">
                        {Object.entries(permissionGroups).map(([category, permissions]) => {
                          const selectedCount = getSelectedCount(permissions);
                          const isAllSelected = selectedCount === permissions.length;
                          const isIndeterminate = selectedCount > 0 && !isAllSelected;

                          return (
                            <AccordionItem key={category} value={category} className="border-b last:border-0">
                              <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="capitalize font-semibold text-slate-700 text-lg">{category}</span>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                      {permissions.length} Permissions
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-4 mr-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="text-sm text-slate-500 mr-2">
                                    {selectedCount} / {permissions.length} selected
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={cn(
                                      "text-xs font-medium border",
                                      isAllSelected ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 border-slate-200 hover:bg-slate-100"
                                    )}
                                    onClick={() => toggleCategory(permissions, !isAllSelected)}
                                  >
                                    {isAllSelected ? 'Deselect All' : 'Select All'}
                                  </Button>
                                </div>
                              </div>
                              <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {permissions.map(permission => {
                                    const isChecked = formData.permissions.includes(permission);
                                    return (
                                      <div
                                        key={permission}
                                        className={cn(
                                          "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                                          isChecked ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300"
                                        )}
                                        onClick={() => togglePermission(permission)}
                                      >
                                        <Checkbox
                                          id={permission}
                                          checked={isChecked}
                                          onCheckedChange={() => togglePermission(permission)}
                                          className={cn("data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600")}
                                        />
                                        <label
                                          htmlFor={permission}
                                          className={cn(
                                            "text-sm font-medium leading-none cursor-pointer select-none",
                                            isChecked ? "text-blue-900" : "text-slate-700"
                                          )}
                                          onClick={(e) => e.stopPropagation()} // Prevent double toggle
                                        >
                                          {formatPermission(permission as Permission)}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                      {Object.keys(permissionGroups).length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                          <Filter className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No permissions found matching "{permissionSearch}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </ScrollArea>

              <DialogFooter className="p-6 bg-white border-t mt-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-11 px-6">Cancel</Button>
                <Button type="submit" form="role-form" className="h-11 px-8 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="py-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading roles configuration...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {roles.map(role => (
            <Card key={role.id} className={cn(
              "group hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-200",
              role.isSystem ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/50" : "bg-white"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl shadow-sm",
                      role.isSystem ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    )}>
                      {role.name === 'Admin' ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{role.name}</CardTitle>
                      {role.isSystem && <span className="text-xs font-medium text-blue-600">System Default</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-600 min-h-[40px] leading-relaxed">
                  {role.description || 'No description provided for this role.'}
                </p>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100">
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-slate-900">{role.userCount ?? 0}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Users</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-slate-900">{role.permissions.length}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Permissions</div>
                  </div>
                </div>

                {!role.isSystem && (
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleEdit(role)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Configuration
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(role.id)} disabled={(role.userCount ?? 0) > 0}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {role.isSystem && (
                  <div className="pt-2">
                    <Button variant="ghost" className="w-full justify-start text-slate-400 cursor-not-allowed font-normal" disabled>
                      <Lock className="h-3 w-3 mr-2" /> System roles cannot be modified
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
