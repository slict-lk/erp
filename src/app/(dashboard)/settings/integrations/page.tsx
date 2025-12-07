'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Database,
    Mail,
    CreditCard,
    MessageSquare,
    ShoppingCart,
    Cloud,
    Truck,
    DollarSign,
    Phone,
    FileText,
    Check,
    AlertCircle,
    Settings,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: any;
    connected: boolean;
    enabled: boolean;
    color: string;
    features?: string[];
}

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Accept online payments and manage subscriptions',
            category: 'Payment',
            icon: CreditCard,
            connected: false,
            enabled: false,
            color: 'bg-purple-500',
            features: ['Online payments', 'Subscriptions', 'Invoicing'],
        },
        {
            id: 'paypal',
            name: 'PayPal',
            description: 'Alternative payment gateway for global transactions',
            category: 'Payment',
            icon: DollarSign,
            connected: false,
            enabled: false,
            color: 'bg-blue-500',
            features: ['Payment processing', 'Global reach', 'Buyer protection'],
        },
        {
            id: 'razorpay',
            name: 'Razorpay',
            description: 'Payment gateway for India and Southeast Asia',
            category: 'Payment',
            icon: CreditCard,
            connected: false,
            enabled: false,
            color: 'bg-indigo-500',
            features: ['UPI', 'Cards', 'Net banking'],
        },
        {
            id: 'sendgrid',
            name: 'SendGrid',
            description: 'Email delivery and marketing automation',
            category: 'Communication',
            icon: Mail,
            connected: false,
            enabled: false,
            color: 'bg-blue-600',
            features: ['Transactional emails', 'Email marketing', 'Templates'],
        },
        {
            id: 'twilio',
            name: 'Twilio',
            description: 'SMS, voice, and WhatsApp messaging',
            category: 'Communication',
            icon: Phone,
            connected: false,
            enabled: false,
            color: 'bg-red-500',
            features: ['SMS', 'Voice calls', 'WhatsApp Business'],
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            description: 'Connect with customers via WhatsApp',
            category: 'Communication',
            icon: MessageSquare,
            connected: false,
            enabled: false,
            color: 'bg-green-500',
            features: ['Direct messaging', 'Automated responses', 'Media sharing'],
        },
        {
            id: 'aws',
            name: 'Amazon S3',
            description: 'Cloud storage for files and documents',
            category: 'Storage',
            icon: Cloud,
            connected: false,
            enabled: false,
            color: 'bg-orange-500',
            features: ['File storage', 'Backups', 'CDN delivery'],
        },
        {
            id: 'shippo',
            name: 'Shippo',
            description: 'Multi-carrier shipping and tracking',
            category: 'Shipping',
            icon: Truck,
            connected: false,
            enabled: false,
            color: 'bg-teal-500',
            features: ['Label printing', 'Rate comparison', 'Tracking'],
        },
        {
            id: 'shopify',
            name: 'Shopify',
            description: 'E-commerce platform integration',
            category: 'E-commerce',
            icon: ShoppingCart,
            connected: false,
            enabled: false,
            color: 'bg-green-600',
            features: ['Product sync', 'Order management', 'Inventory sync'],
        },
        {
            id: 'quickbooks',
            name: 'QuickBooks',
            description: 'Accounting software integration',
            category: 'Accounting',
            icon: FileText,
            connected: false,
            enabled: false,
            color: 'bg-blue-700',
            features: ['Invoice sync', 'Expense tracking', 'Financial reports'],
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Team communication and notifications',
            category: 'Communication',
            icon: MessageSquare,
            connected: false,
            enabled: false,
            color: 'bg-purple-600',
            features: ['Notifications', 'Team chat', 'File sharing'],
        },
        {
            id: 'google-workspace',
            name: 'Google Workspace',
            description: 'Gmail, Drive, Calendar, and more',
            category: 'Productivity',
            icon: Database,
            connected: false,
            enabled: false,
            color: 'bg-red-600',
            features: ['Email integration', 'Calendar sync', 'Drive storage'],
        },
    ]);

    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [showConfig, setShowConfig] = useState(false);

    const toggleIntegration = (id: string) => {
        setIntegrations(
            integrations.map((int) =>
                int.id === id ? { ...int, enabled: !int.enabled } : int
            )
        );
    };

    const connectIntegration = (integration: Integration) => {
        setSelectedIntegration(integration);
        setShowConfig(true);
    };

    const categories = Array.from(new Set(integrations.map((int) => int.category)));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                    <p className="text-gray-600">Connect third-party services to extend functionality</p>
                </div>
                <Link href="/settings">
                    <Button variant="outline">Back to Settings</Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">
                                {integrations.filter((int) => int.connected).length}
                            </p>
                            <p className="text-sm text-gray-500">Connected</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">
                                {integrations.filter((int) => int.enabled).length}
                            </p>
                            <p className="text-sm text-gray-500">Enabled</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">{integrations.length}</p>
                            <p className="text-sm text-gray-500">Available</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Integrations by Category */}
            {categories.map((category) => (
                <div key={category} className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {integrations
                            .filter((int) => int.category === category)
                            .map((integration) => (
                                <Card
                                    key={integration.id}
                                    className="hover:shadow-lg transition-shadow"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-lg ${integration.color} bg-opacity-10`}
                                                >
                                                    <integration.icon
                                                        className={`h-6 w-6 ${integration.color.replace('bg-', 'text-')}`}
                                                    />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{integration.name}</CardTitle>
                                                    {integration.connected && (
                                                        <Badge variant="default" className="mt-1">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Connected
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Switch
                                                checked={integration.enabled}
                                                onCheckedChange={() => toggleIntegration(integration.id)}
                                                disabled={!integration.connected}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600">{integration.description}</p>
                                        {integration.features && (
                                            <div className="flex flex-wrap gap-1">
                                                {integration.features.map((feature) => (
                                                    <Badge key={feature} variant="secondary" className="text-xs">
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={integration.connected ? 'outline' : 'default'}
                                                className="flex-1"
                                                onClick={() => connectIntegration(integration)}
                                            >
                                                {integration.connected ? (
                                                    <>
                                                        <Settings className="h-4 w-4 mr-1" />
                                                        Configure
                                                    </>
                                                ) : (
                                                    'Connect'
                                                )}
                                            </Button>
                                            <Button size="sm" variant="ghost">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </div>
            ))}

            {/* Configuration Modal/Alert */}
            {showConfig && selectedIntegration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-3 rounded-lg ${selectedIntegration.color} bg-opacity-10`}
                                    >
                                        <selectedIntegration.icon
                                            className={`h-8 w-8 ${selectedIntegration.color.replace('bg-', 'text-')}`}
                                        />
                                    </div>
                                    <div>
                                        <CardTitle>{selectedIntegration.name} Configuration</CardTitle>
                                        <CardDescription>{selectedIntegration.description}</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConfig(false)}
                                >
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Integration configuration is not yet implemented. This would typically include API keys, authentication, and specific settings for {selectedIntegration.name}.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="Enter your API key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="apiSecret">API Secret</Label>
                                    <Input
                                        id="apiSecret"
                                        type="password"
                                        placeholder="Enter your API secret"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                                    <Input
                                        id="webhookUrl"
                                        type="url"
                                        placeholder="https://your-domain.com/webhook"
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/integrations/${selectedIntegration.id}/webhook`}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {selectedIntegration.features && (
                                <div className="space-y-2">
                                    <Label>Features</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedIntegration.features.map((feature) => (
                                            <div key={feature} className="flex items-center space-x-2">
                                                <Switch id={`feature-${feature}`} />
                                                <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowConfig(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIntegrations(
                                            integrations.map((int) =>
                                                int.id === selectedIntegration.id
                                                    ? { ...int, connected: true, enabled: true }
                                                    : int
                                            )
                                        );
                                        setShowConfig(false);
                                    }}
                                >
                                    {selectedIntegration.connected ? 'Save Changes' : 'Connect'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
