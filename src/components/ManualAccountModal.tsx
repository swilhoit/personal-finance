'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ManualAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAccountModal({ isOpen, onClose, onSuccess }: ManualAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'credit',
    balance: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('/api/accounts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          balance: formData.balance ? parseFloat(formData.balance) : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || 'Failed to create account' });
        }
        return;
      }

      // Reset form and close
      setFormData({ name: '', type: 'checking', balance: '' });
      onSuccess();
      onClose();
    } catch {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', type: 'checking', balance: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Manual Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Chase Checking"
            className={`
              w-full px-3 py-2 text-sm border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.name ? 'border-red-300' : 'border-gray-300'}
            `}
            required
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'checking' | 'savings' | 'credit' })}
            className={`
              w-full px-3 py-2 text-sm border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.type ? 'border-red-300' : 'border-gray-300'}
            `}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit Card</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type}</p>
          )}
        </div>

        {/* Starting Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Starting Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              placeholder="0.00"
              className={`
                w-full pl-7 pr-3 py-2 text-sm border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                ${errors.balance ? 'border-red-300' : 'border-gray-300'}
              `}
            />
          </div>
          {errors.balance && (
            <p className="mt-1 text-xs text-red-600">{errors.balance}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Optional. You can update this later.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            Add Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
