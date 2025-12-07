import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X, Eye, EyeOff } from 'lucide-react';
import { AVAILABLE_MODULES, MODULE_CATEGORIES, generateDefaultModulePermissions, ModulePermissions } from '@/lib/modules';

// Dynamically generate permissions schema
const permissionsSchema = z.record(z.boolean());

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'VIEWER']),
  department: z.string().optional(),
  isActive: z.boolean(),
  // Allow dynamic keys for permissions
  permissions: z.record(z.any()),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData> & { id?: string; permissions?: any };
  onSubmit: (data: UserFormData & { modulePermissions?: ModulePermissions }) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize default permissions based on available modules
  const defaultPermissions: Record<string, boolean> = {};
  AVAILABLE_MODULES.forEach(m => {
    defaultPermissions[m.id] = false;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      password: '',
      role: initialData?.role || 'USER',
      department: initialData?.department || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      permissions: initialData?.permissions || defaultPermissions,
    },
  });

  const role = watch('role');
  const isActive = watch('isActive');
  const currentPermissions = watch('permissions');

  // Update permissions when role changes
  const handleRoleChange = (newRole: string) => {
    setValue('role', newRole as any);

    const defaults = generateDefaultModulePermissions(newRole as any);
    const newPermissions: Record<string, boolean> = {};

    Object.keys(defaults).forEach(key => {
      newPermissions[key] = defaults[key].enabled;
    });

    setValue('permissions', newPermissions);
  };

  const onFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      // Transform flat permissions back to ModulePermissions structure
      const modulePermissions: ModulePermissions = {};
      const defaults = generateDefaultModulePermissions(data.role as any);

      Object.keys(data.permissions).forEach(moduleId => {
        const isEnabled = data.permissions[moduleId];
        const defaultPerm = defaults[moduleId] || {
          enabled: false,
          view: false,
          create: false,
          edit: false,
          delete: false
        };

        modulePermissions[moduleId] = {
          ...defaultPerm,
          enabled: isEnabled,
          // If enabled, ensure view is true
          view: isEnabled ? true : false,
        };
      });

      await onSubmit({
        ...data,
        modulePermissions
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group modules by category
  const modulesByCategory = MODULE_CATEGORIES.map(category => ({
    ...category,
    modules: AVAILABLE_MODULES.filter(m => m.category === category.id)
  })).filter(cat => cat.modules.length > 0);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Doe"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.doe@company.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">
                Password {!initialData?.id && '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder={initialData?.id ? 'Leave blank to keep current' : 'Min 8 characters'}
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="Sales, IT, HR..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active Account
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {role === 'ADMIN' && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4">
                ℹ️ Administrators have full access to all modules by default.
              </div>
            )}

            {modulesByCategory.map(category => (
              <div key={category.id} className="border-b pb-4 last:border-0">
                <h3 className="font-medium text-gray-900 mb-3">{category.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.modules.map(module => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Switch
                        id={`module-${module.id}`}
                        checked={currentPermissions?.[module.id] || false}
                        onCheckedChange={(checked) => {
                          setValue(`permissions.${module.id}`, checked);
                        }}
                        disabled={role === 'ADMIN'}
                      />
                      <Label htmlFor={`module-${module.id}`} className="cursor-pointer">
                        {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
