'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Moon, Sun, Monitor, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AppearancePage() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [accentColor, setAccentColor] = useState('blue');
    const [fontSize, setFontSize] = useState('medium');
    const [compactMode, setCompactMode] = useState(false);
    const [animations, setAnimations] = useState(true);
    const [sidebar, setSidebar] = useState('default');

    useEffect(() => {
        // Load saved preferences from localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
        const savedAccentColor = localStorage.getItem('accentColor') || 'blue';
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        const savedCompactMode = localStorage.getItem('compactMode') === 'true';
        const savedAnimations = localStorage.getItem('animations') !== 'false';
        const savedSidebar = localStorage.getItem('sidebar') || 'default';

        setTheme(savedTheme);
        setAccentColor(savedAccentColor);
        setFontSize(savedFontSize);
        setCompactMode(savedCompactMode);
        setAnimations(savedAnimations);
        setSidebar(savedSidebar);

        applyTheme(savedTheme);
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        const root = document.documentElement;

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.toggle('dark', systemTheme === 'dark');
        } else {
            root.classList.toggle('dark', newTheme === 'dark');
        }
    };

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const handleAccentColorChange = (color: string) => {
        setAccentColor(color);
        localStorage.setItem('accentColor', color);
        // Apply accent color to root
        document.documentElement.style.setProperty('--primary', getAccentColorValue(color));
    };

    const handleFontSizeChange = (size: string) => {
        setFontSize(size);
        localStorage.setItem('fontSize', size);
        document.documentElement.style.fontSize = getFontSizeValue(size);
    };

    const handleCompactModeChange = (enabled: boolean) => {
        setCompactMode(enabled);
        localStorage.setItem('compactMode', enabled.toString());
    };

    const handleAnimationsChange = (enabled: boolean) => {
        setAnimations(enabled);
        localStorage.setItem('animations', enabled.toString());
        document.documentElement.style.setProperty('--animation-duration', enabled ? '0.3s' : '0s');
    };

    const handleSidebarChange = (style: string) => {
        setSidebar(style);
        localStorage.setItem('sidebar', style);
    };

    const getAccentColorValue = (color: string): string => {
        const colors: Record<string, string> = {
            blue: '221.2 83.2% 53.3%',
            green: '142.1 76.2% 36.3%',
            purple: '262.1 83.3% 57.8%',
            red: '0 84.2% 60.2%',
            orange: '24.6 95% 53.1%',
            pink: '330.4 81.2% 60.4%',
        };
        return colors[color] || colors.blue;
    };

    const getFontSizeValue = (size: string): string => {
        const sizes: Record<string, string> = {
            small: '14px',
            medium: '16px',
            large: '18px',
        };
        return sizes[size] || sizes.medium;
    };

    const resetToDefaults = () => {
        handleThemeChange('system');
        handleAccentColorChange('blue');
        handleFontSizeChange('medium');
        handleCompactModeChange(false);
        handleAnimationsChange(true);
        handleSidebarChange('default');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appearance</h1>
                    <p className="text-gray-600">Customize how your application looks and feels</p>
                </div>
                <Link href="/settings">
                    <Button variant="outline">Back to Settings</Button>
                </Link>
            </div>

            {/* Theme Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Theme
                    </CardTitle>
                    <CardDescription>Choose your preferred color scheme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`p-4 border-2 rounded-lg transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                            <p className="text-sm font-medium">Light</p>
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`p-4 border-2 rounded-lg transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                            <p className="text-sm font-medium">Dark</p>
                        </button>
                        <button
                            onClick={() => handleThemeChange('system')}
                            className={`p-4 border-2 rounded-lg transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-medium">System</p>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Accent Color */}
            <Card>
                <CardHeader>
                    <CardTitle>Accent Color</CardTitle>
                    <CardDescription>Choose your primary accent color</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-6 gap-3">
                        {[
                            { name: 'blue', color: 'bg-blue-500' },
                            { name: 'green', color: 'bg-green-500' },
                            { name: 'purple', color: 'bg-purple-500' },
                            { name: 'red', color: 'bg-red-500' },
                            { name: 'orange', color: 'bg-orange-500' },
                            { name: 'pink', color: 'bg-pink-500' },
                        ].map((colorOption) => (
                            <button
                                key={colorOption.name}
                                onClick={() => handleAccentColorChange(colorOption.name)}
                                className={`h-12 w-12 rounded-full ${colorOption.color} transition-transform ${accentColor === colorOption.name ? 'scale-110 ring-4 ring-offset-2 ring-gray-300' : 'hover:scale-105'
                                    }`}
                                aria-label={`Select ${colorOption.name} color`}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Display Settings
                    </CardTitle>
                    <CardDescription>Adjust font size and layout preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select value={fontSize} onValueChange={handleFontSizeChange}>
                            <SelectTrigger id="fontSize">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium (Default)</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sidebar">Sidebar Style</Label>
                        <Select value={sidebar} onValueChange={handleSidebarChange}>
                            <SelectTrigger id="sidebar">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="expanded">Expanded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="compact">Compact Mode</Label>
                            <p className="text-sm text-gray-500">Reduce spacing and padding</p>
                        </div>
                        <Switch id="compact" checked={compactMode} onCheckedChange={handleCompactModeChange} />
                    </div>
                </CardContent>
            </Card>

            {/* Animations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Animations
                    </CardTitle>
                    <CardDescription>Control interface animations and transitions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="animations">Enable Animations</Label>
                            <p className="text-sm text-gray-500">Show smooth transitions and effects</p>
                        </div>
                        <Switch id="animations" checked={animations} onCheckedChange={handleAnimationsChange} />
                    </div>
                </CardContent>
            </Card>

            {/* Reset Button */}
            <div className="flex justify-end">
                <Button variant="outline" onClick={resetToDefaults}>
                    Reset to Defaults
                </Button>
            </div>
        </div>
    );
}
