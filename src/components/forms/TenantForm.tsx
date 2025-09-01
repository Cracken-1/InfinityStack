'use client'

import { useState } from 'react'
import { Building, Globe, Briefcase } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { INDUSTRIES, SUBSCRIPTION_TIERS } from '@/lib/constants'

interface TenantFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: any
}

export default function TenantForm({ onSubmit, onCancel, initialData }: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    domain: initialData?.domain || '',
    industry: initialData?.industry || '',
    subscriptionTier: initialData?.subscriptionTier || 'STARTER'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Organization Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        icon={<Building className="h-4 w-4" />}
        required
      />

      <Input
        label="Domain"
        value={formData.domain}
        onChange={(e) => handleChange('domain', e.target.value)}
        icon={<Globe className="h-4 w-4" />}
        placeholder="company.com"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <select
          value={formData.industry}
          onChange={(e) => handleChange('industry', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value="">Select Industry</option>
          {Object.entries(INDUSTRIES).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
        <select
          value={formData.subscriptionTier}
          onChange={(e) => handleChange('subscriptionTier', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
            <option key={key} value={key}>
              {tier.name} - ${tier.price}/month
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Tenant
        </Button>
      </div>
    </form>
  )
}