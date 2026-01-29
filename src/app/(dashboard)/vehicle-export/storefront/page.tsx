
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Plus, Trash2, Image as ImageIcon, Globe, Layout, Palette, Wrench } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

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
    aboutUs?: {
        story?: string;
        mission?: string;
        stats?: Array<{ value: string; label: string; icon: string }>;
        values?: Array<{ title: string; desc: string }>;
    };
    services?: Array<{
        title: string;
        description: string;
        icon: string;
        linkText: string;
        linkUrl: string;
    }>;
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
    const [activeTab, setActiveTab] = useState('general');
    const { toast } = useToast();

    const { register, handleSubmit, setValue, watch, reset } = useForm<ExportStoreConfig>();

    // Fetch Config on Load
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
            toast({ title: 'Error', description: 'Failed to load storefront config', variant: 'destructive' });
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
                toast({ title: 'Success', description: 'Storefront updated successfully' });
                fetchConfig(); // Refresh
            } else {
                toast({ title: 'Error', description: 'Failed to update storefront', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error saving changes', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Generic file upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ExportStoreConfig | 'hero' | 'banner' | 'category', index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'vehicle-export');

        // Using the shared upload API
        const promise = fetch('/api/upload', {
            method: 'POST',
            body: formData,
        }).then(async (res) => {
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.url;
        });

        // Use custom promise handling since shadcn toast is different from sonner
        promise.then((url) => {
            if (fieldName === 'logoUrl') {
                setValue('logoUrl', url, { shouldDirty: true });
            } else if (fieldName === 'hero' && config) {
                const newSlides = [...(watch('heroSlides') || [])];
                if (index !== undefined && newSlides[index]) {
                    newSlides[index].imageUrl = url;
                    setValue('heroSlides', newSlides, { shouldDirty: true });
                }
            } else if (fieldName === 'category') {
                const newCats = [...(watch('featuredCategories') || [])];
                if (index !== undefined && newCats[index]) {
                    newCats[index].imageUrl = url;
                    setValue('featuredCategories', newCats, { shouldDirty: true });
                }
            } else if (fieldName === 'banner') {
                const newBanners = [...(watch('promoBanners') || [])];
                if (index !== undefined && newBanners[index]) {
                    newBanners[index].imageUrl = url;
                    setValue('promoBanners', newBanners, { shouldDirty: true });
                }
            }
            toast({ title: 'Success', description: 'Image uploaded successfully' });
        }).catch(() => {
            toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
        });
    };

    const addNewSlide = () => {
        const currentSlides = watch('heroSlides') || [];
        setValue('heroSlides', [
            ...currentSlides,
            { id: Date.now().toString(), title: 'New Slide', imageUrl: '', link: '#' }
        ]);
    };

    const removeSlide = (index: number) => {
        const currentSlides = watch('heroSlides') || [];
        setValue('heroSlides', currentSlides.filter((_, i) => i !== index));
    };

    const addNewCategory = () => {
        const currentCats = watch('featuredCategories') || [];
        setValue('featuredCategories', [
            ...currentCats,
            { id: Date.now().toString(), name: 'New Category', slug: 'new-category', imageUrl: '' }
        ]);
    };

    const removeCategory = (index: number) => {
        const currentCats = watch('featuredCategories') || [];
        setValue('featuredCategories', currentCats.filter((_, i) => i !== index));
    };

    if (loading) return <div className="p-8">Loading Storefront Config...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Storefront Manager</h1>
                    <p className="text-gray-500">Manage your vehicle export website appearance and content</p>
                </div>
                <button
                    onClick={handleSubmit(handleSave)}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8 w-fit overflow-x-auto">
                {[
                    { id: 'general', label: 'General & Branding', icon: Palette },
                    { id: 'hero', label: 'Hero Slider', icon: Layout },
                    { id: 'contact', label: 'Contact Info', icon: Globe },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 max-w-3xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                                    <input {...register('storeName')} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline</label>
                                    <textarea {...register('tagline')} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors text-center">
                                <label className="cursor-pointer block">
                                    <div className="w-32 h-32 mx-auto relative mb-4 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                                        {watch('logoUrl') ? (
                                            <Image src={watch('logoUrl')!} alt="Logo" fill className="object-contain p-2" />
                                        ) : (
                                            <ImageIcon className="text-gray-300 w-12 h-12" />
                                        )}
                                    </div>
                                    <span className="text-blue-600 font-medium text-sm hover:underline">Upload Logo</span>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG (Auto WebP)</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" {...register('primaryColor')} className="w-12 h-12 p-1 rounded cursor-pointer" />
                                    <input {...register('primaryColor')} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent w-32 uppercase" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HERO SLIDER TAB */}
                {activeTab === 'hero' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Hero Slides</h3>
                            <button type="button" onClick={addNewSlide} className="text-sm flex items-center gap-1 text-blue-600 font-medium hover:underline">
                                <Plus size={16} /> Add Slide
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {(watch('heroSlides') || []).map((slide, index) => (
                                <div key={index} className="flex gap-6 p-6 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 relative group">
                                    {/* Image Upload Area */}
                                    <div className="w-48 h-32 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center relative overflow-hidden shrink-0">
                                        {slide.imageUrl ? (
                                            <Image src={slide.imageUrl} alt="Slide" fill className="object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">No Image</span>
                                        )}
                                        <label className="absolute inset-0 bg-black/0 hover:bg-black/10 cursor-pointer transition-colors flex items-center justify-center">
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero', index)} />
                                            <Upload className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                        </label>
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-gray-500">Title</label>
                                            <input
                                                {...register(`heroSlides.${index}.title` as const)}
                                                className="w-full mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                                                placeholder="New Arrivals"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Subtitle (Optional)</label>
                                            <input
                                                {...register(`heroSlides.${index}.subtitle` as const)}
                                                className="w-full mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                                                placeholder="Best Deals"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeSlide(index)}
                                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-white dark:bg-gray-900 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input {...register('contactEmail')} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                            <input {...register('contactPhone')} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                            <input {...register('whatsappNumber')} placeholder="+81..." className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                            <textarea {...register('address')} rows={2} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook URL</label>
                            <input {...register('facebookUrl')} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram URL</label>
                            <input {...register('instagramUrl')} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent" />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
