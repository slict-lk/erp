'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserList } from '@/components/settings/UserList';
import { UserForm } from '@/components/settings/UserForm';
import { ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  permissions?: {
    sales: boolean;
    accounting: boolean;
    inventory: boolean;
    hr: boolean;
    purchasing: boolean;
    manufacturing: boolean;
    projects: boolean;
    reports: boolean;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/settings/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Fallback to empty array
      setUsers([]);
    }
  };

  const fetchUsersOld = async () => {
    // Simulated data - replace with actual API call
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'ADMIN',
        department: 'Management',
        isActive: true,
        lastLogin: new Date('2024-10-27'),
        createdAt: new Date('2024-01-01'),
        permissions: {
          sales: true,
          accounting: true,
          inventory: true,
          hr: true,
          purchasing: true,
          manufacturing: true,
          projects: true,
          reports: true,
        },
      },
      {
        id: '2',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'MANAGER',
        department: 'Sales',
        isActive: true,
        lastLogin: new Date('2024-10-26'),
        createdAt: new Date('2024-02-15'),
        permissions: {
          sales: true,
          accounting: false,
          inventory: true,
          hr: false,
          purchasing: false,
          manufacturing: false,
          projects: true,
          reports: true,
        },
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        role: 'USER',
        department: 'Accounting',
        isActive: true,
        lastLogin: new Date('2024-10-27'),
        createdAt: new Date('2024-03-10'),
        permissions: {
          sales: false,
          accounting: true,
          inventory: false,
          hr: false,
          purchasing: false,
          manufacturing: false,
          projects: false,
          reports: true,
        },
      },
      {
        id: '4',
        name: 'Mike Davis',
        email: 'mike.davis@company.com',
        role: 'USER',
        department: 'Warehouse',
        isActive: true,
        lastLogin: new Date('2024-10-25'),
        createdAt: new Date('2024-04-01'),
        permissions: {
          sales: false,
          accounting: false,
          inventory: true,
          hr: false,
          purchasing: true,
          manufacturing: true,
          projects: false,
          reports: false,
        },
      },
      {
        id: '5',
        name: 'Emily Brown',
        email: 'emily.b@company.com',
        role: 'VIEWER',
        department: 'Executive',
        isActive: true,
        lastLogin: new Date('2024-10-24'),
        createdAt: new Date('2024-05-15'),
        permissions: {
          sales: false,
          accounting: false,
          inventory: false,
          hr: false,
          purchasing: false,
          manufacturing: false,
          projects: false,
          reports: true,
        },
      },
      {
        id: '6',
        name: 'Tom Wilson',
        email: 'tom.wilson@company.com',
        role: 'USER',
        department: 'HR',
        isActive: false,
        createdAt: new Date('2024-01-20'),
        permissions: {
          sales: false,
          accounting: false,
          inventory: false,
          hr: true,
          purchasing: false,
          manufacturing: false,
          projects: false,
          reports: true,
        },
      },
    ];
    setUsers(mockUsers);
  };

  const handleCreateUser = async (data: any) => {
    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const result = await response.json();
      await fetchUsers(); // Refresh list
      setViewMode('list');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (data: any) => {
    if (!selectedUser?.id) return;

    try {
      const response = await fetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      await fetchUsers(); // Refresh list
      setViewMode('list');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.message || 'Failed to update user');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      await fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  return (
    <div className="space-y-6 p-6">
      {viewMode === 'list' ? (
        <UserList
          users={users}
          onCreateNew={() => setViewMode('create')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      ) : (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setViewMode('list');
              setSelectedUser(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New User' : 'Edit User'}
          </h1>
          <UserForm
            initialData={selectedUser ? {
              ...selectedUser,
              role: selectedUser.role as 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | undefined,
            } : undefined}
            onSubmit={viewMode === 'create' ? handleCreateUser : handleUpdateUser}
            onCancel={() => {
              setViewMode('list');
              setSelectedUser(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
