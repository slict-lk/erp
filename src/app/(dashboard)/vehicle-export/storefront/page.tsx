"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Plus, Trash2, Image as ImageIcon, Globe, Layout, Palette, Wrench, Eye, Monitor, Smartphone, Moon, Sun, Check } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FadeIn, SlideUp } from '@/components/ui/motion/primitives';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// ... (Existing interfaces - keeping them same for compatibility)
interface ExportStoreConfig {
    id: string;
    storeName: string;
    tagline: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    heroSlides: HeroSlide[];
    promoBanners: Banner[];
    featuredCategories: FeaturedCategory[];
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    address?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    // Bidding Settings
    requireDeposit?: boolean;
    minimumDeposit?: number;
}

interface HeroSlide {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
}

interface Banner {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    bgColor?: string;
}

interface FeaturedCategory {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
}

export default function StorefrontManagerPage() {
    const [config, setConfig] = useState<ExportStoreConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    const { register, handleSubmit, setValue, watch, reset } = useForm<ExportStoreConfig>();

    const primaryColor = watch('primaryColor') || '#3b82f6';
    const storeName = watch('storeName') || 'Your Store';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/vehicle-export/config');
            const data = await res.json();
            if (data?.id) {
                setConfig(data);
                reset(data);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load config', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: ExportStoreConfig) => {
        setSaving(true);
        try {
            const res = await fetch('/api/vehicle-export/config', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                toast({
                    title: 'Published Successfully',
                    description: 'Your storefront changes are now live.',
                });
                fetchConfig();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Could not save changes', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any, index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'vehicle-export');

        const toastId = toast({ title: 'Uploading...', description: 'Please wait' });

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                if (fieldName === 'logoUrl') {
                    setValue('logoUrl', data.url, { shouldDirty: true });
                } else if (fieldName === 'hero') {
                    const newSlides = [...(watch('heroSlides') || [])];
                    if (index !== undefined && newSlides[index]) {
                        newSlides[index].imageUrl = data.url;
                        setValue('heroSlides', newSlides, { shouldDirty: true });
                    }
                }
                toast({ title: 'Upload Complete' });
            }
        } catch (error) {
            toast({ title: 'Upload Failed', variant: 'destructive' });
        }
    };

    // Helper to add slide
    const addSlide = () => {
        const slides = watch('heroSlides') || [];
        setValue('heroSlides', [...slides, { id: Date.now().toString(), title: 'New Slide', imageUrl: '' }]);
    };

    // Helper to remove slide
    const removeSlide = (index: number) => {
        const slides = watch('heroSlides') || [];
        setValue('heroSlides', slides.filter((_, i) => i !== index));
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>;

    return (
        <div className="h-[calc(100vh-4rem)] p-4 flex gap-6 bg-gray-50/50 dark:bg-black overflow-hidden">

            {/* LEFT PANEL: Editor */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">

                {/* Editor Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Palette className="h-6 w-6 text-pink-500" />
                            Visual Editor
                        </h1>
                        <p className="text-sm text-gray-500">Customize your digital storefront</p>
                    </div>
                    <Button
                        onClick={handleSubmit(handleSave)}
                        disabled={saving}
                        className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 rounded-full px-6"
                    >
                        {saving ? 'Publishing...' : 'Publish Changes'}
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Tabs defaultValue="branding" className="w-full">
                        <div className="px-8 pt-6 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4">
                            <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full justify-start overflow-x-auto">
                                <TabsTrigger value="branding" className="rounded-lg px-4">Branding</TabsTrigger>
                                <TabsTrigger value="content" className="rounded-lg px-4">Hero & Content</TabsTrigger>
                                <TabsTrigger value="contact" className="rounded-lg px-4">Info & Contact</TabsTrigger>
                                <TabsTrigger value="settings" className="rounded-lg px-4">Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="px-8 pb-20 space-y-8">

                            {/* BRANDING */}
                            <TabsContent value="branding" className="space-y-6 mt-0">
                                <FadeIn>
                                    <div className="grid gap-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center group cursor-pointer hover:border-indigo-400 transition-colors">
                                            <div className="relative w-32 h-32 mx-auto mb-4 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden">
                                                {watch('logoUrl') ? (
                                                    <Image src={watch('logoUrl')!} alt="Logo" fill className="object-contain p-4" />
                                                ) : <ImageIcon className="text-gray-300 h-10 w-10" />}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload className="text-white h-6 w-6" />
                                                </div>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                                            </div>
                                            <p className="text-sm font-medium">Upload Brand Logo</p>
                                            <p className="text-xs text-gray-400 mt-1">Recommended: 512x512 PNG</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Store Name</Label>
                                                    <Input {...register('storeName')} placeholder="e.g. Unity Auto Export" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Brand Color</Label>
                                                    <div className="flex gap-2">
                                                        <input type="color" {...register('primaryColor')} className="h-10 w-12 rounded cursor-pointer" />
                                                        <Input {...register('primaryColor')} className="uppercase font-mono" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tagline</Label>
                                                <Input {...register('tagline')} placeholder="Premium Japanese Vehicles Direct to You" />
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </TabsContent>

                            {/* CONTENT */}
                            <TabsContent value="content" className="space-y-6 mt-0">
                                <FadeIn>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Hero Carousel</h3>
                                            <Button size="sm" variant="outline" onClick={addSlide}><Plus className="h-4 w-4 mr-2" />Add Slide</Button>
                                        </div>

                                        <AnimatePresence>
                                            {(watch('heroSlides') || []).map((slide, index) => (
                                                <motion.div
                                                    key={slide.id || index}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative group"
                                                >
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeSlide(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg relative overflow-hidden shrink-0">
                                                            {slide.imageUrl && <Image src={slide.imageUrl} alt="Slide" fill className="object-cover" />}
                                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, 'hero', index)} />
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <ImageIcon className="text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <Input {...register(`heroSlides.${index}.title` as const)} placeholder="Headline Text" className="font-bold" />
                                                            <Input {...register(`heroSlides.${index}.subtitle` as const)} placeholder="Subtext (Optional)" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </FadeIn>
                            </TabsContent>

                            {/* CONTACT */}
                            <TabsContent value="contact" className="space-y-6 mt-0">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input {...register('contactEmail')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input {...register('contactPhone')} />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>WhatsApp (for direct chat)</Label>
                                        <Input {...register('whatsappNumber')} placeholder="+1..." />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Physical Address</Label>
                                        <Input {...register('address')} />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SETTINGS */}
                            <TabsContent value="settings" className="space-y-6 mt-0">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Bidding Security</h3>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">Require deposits before users can place bids.</p>
                                        </div>
                                        <Switch
                                            checked={watch('requireDeposit')}
                                            onCheckedChange={(checked) => setValue('requireDeposit', checked)}
                                        />
                                    </div>
                                    {watch('requireDeposit') && (
                                        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <span className="text-gray-500 font-bold">$</span>
                                            <Input
                                                type="number"
                                                {...register('minimumDeposit', { valueAsNumber: true })}
                                                className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto font-mono text-lg"
                                                placeholder="5000"
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                        </div>
                    </Tabs>
                </div>
            </div>

            {/* RIGHT PANEL: Live Preview */}
            <div className="w-[400px] hidden xl:flex flex-col bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] border-8 border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden relative">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20" />

                {/* Preview Controls */}
                <div className="absolute top-8 right-4 z-20 flex gap-2">
                    {/* Could add interactive toggle here if needed */}
                </div>

                {/* Simulated Screen */}
                <div className="flex-1 bg-white dark:bg-black overflow-y-auto w-full no-scrollbar relative">

                    {/* Simulated Navbar */}
                    <div className="p-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur z-10">
                        <div className="text-lg font-bold" style={{ color: primaryColor }}>{storeName}</div>
                        <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800" />
                    </div>

                    {/* Simulated Hero */}
                    <div className="h-48 bg-gray-100 dark:bg-gray-900 relative">
                        {(watch('heroSlides') || [])[0]?.imageUrl && (
                            <Image src={(watch('heroSlides') || [])[0].imageUrl} alt="Hero" fill className="object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                            <h2 className="text-white text-xl font-bold leading-tight">
                                {(watch('heroSlides') || [])[0]?.title || 'Welcome Home'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {(watch('heroSlides') || [])[0]?.subtitle || watch('tagline')}
                            </p>
                        </div>
                    </div>

                    {/* Simulated Inventory Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2 space-y-2">
                                <div className="w-full h-2/3 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                                <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                                <div className="h-2 w-1/3 bg-gray-200 dark:bg-gray-800 rounded opacity-50" />
                            </div>
                        ))}
                    </div>

                </div>
            </div>

        </div>
    );
}
