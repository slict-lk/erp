'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onFileSelect?: (file: File) => void;
    placeholder?: string;
    aspectRatio?: 'square' | 'video' | 'banner';
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onFileSelect,
    placeholder = 'Upload an image',
    aspectRatio = 'video',
    className,
}: ImageUploadProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectClasses = {
        square: 'aspect-square',
        video: 'aspect-video',
        banner: 'aspect-[3/1]',
    };

    const handleFileSelect = useCallback((file: File) => {
        setError(null);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Call callbacks
        if (onFileSelect) {
            onFileSelect(file);
        }
        // For now, just set the preview - actual upload will come later
        onChange(objectUrl);
    }, [onChange, onFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) {
            setError('Please enter a URL');
            return;
        }

        setError(null);
        setIsLoading(true);

        // Validate URL by trying to load the image
        const img = new window.Image();
        img.onload = () => {
            setPreviewUrl(urlInput);
            onChange(urlInput);
            setIsLoading(false);
        };
        img.onerror = () => {
            setError('Could not load image from URL');
            setIsLoading(false);
        };
        img.src = urlInput;
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        setUrlInput('');
        setError(null);
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Preview */}
            {previewUrl ? (
                <div className={cn('relative rounded-lg overflow-hidden border bg-muted', aspectClasses[aspectRatio])}>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                /* Upload Interface */
                <Card className="border-dashed">
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
                            <TabsList className="w-full rounded-b-none">
                                <TabsTrigger value="upload" className="flex-1">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload File
                                </TabsTrigger>
                                <TabsTrigger value="url" className="flex-1">
                                    <Link className="h-4 w-4 mr-2" />
                                    Image URL
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="m-0">
                                <div
                                    className={cn(
                                        'flex flex-col items-center justify-center p-8 cursor-pointer transition-colors',
                                        aspectClasses[aspectRatio],
                                        isDragging ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
                                    <p className="text-sm text-muted-foreground text-center">
                                        {isDragging ? (
                                            'Drop image here...'
                                        ) : (
                                            <>
                                                <span className="font-medium text-primary">Click to upload</span> or drag and drop
                                            </>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileInputChange}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="m-0 p-4">
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleUrlSubmit}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Load'
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enter a direct link to an image file
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}
        </div>
    );
}
